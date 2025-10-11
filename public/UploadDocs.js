
const contractAddress = "YOUR_CONTRACT_ADDRESS"; 
const contractABI = "CONTRACT_ABI";
let provider, signer, contract;
const hiddenId = document.getElementById("hidden-id");
const fileInput = document.getElementById('file-input');
const dropZone = document.getElementById('drop-zone');
const fileNameDisplay = document.getElementById('file-name');
const jsonOutput = document.getElementById('json-output');
const outputContainer = document.getElementById('output-container');
const copyButton = document.getElementById('copy-button');
const copyMessage = document.getElementById('copy-message');
const jwt = "Your Pinata JWT";
// Allow file selection by clicking the drop zone
dropZone.addEventListener('click', () => fileInput.click());

// Handle drag and drop events
dropZone.addEventListener('dragover', (e) => {
	e.preventDefault();
	dropZone.classList.add('border-indigo-600', 'bg-indigo-50');
});

dropZone.addEventListener('dragleave', (e) => {
	e.preventDefault();
	dropZone.classList.remove('border-indigo-600', 'bg-indigo-50');
});

dropZone.addEventListener('drop', (e) => {
	e.preventDefault();
	dropZone.classList.remove('border-indigo-600', 'bg-indigo-50');
	const files = e.dataTransfer.files;
	if (files.length > 0) {
		fileInput.files = files;
		handleFileSelect({ target: fileInput });
	}
});

// Handle file selection from the input
fileInput.addEventListener('change', handleFileSelect);

	 function handleFileSelect(event) {
	const file = event.target.files[0];
	if (!file) {
		return;
	}

	// Display the selected file name
	fileNameDisplay.textContent = `Selected file: ${file.name}`;
	
	const reader = new FileReader();
	// Example: remove the id from an element
	const element = document.getElementById('main-id');
	element.remove(); 
	document.getElementById("hidden-id").style.display = 'block';
	document.getElementById("hidden-id").textContent = "In progress...";
	reader.onload = async function(e) {
		try {
			const data = new Uint8Array(e.target.result);
			// Use SheetJS to parse the file data
			const workbook = XLSX.read(data, { type: 'array' });

			// Get the first sheet name
			const firstSheetName = workbook.SheetNames[0];
			const worksheet = workbook.Sheets[firstSheetName];

			// Convert sheet data to JSON
			// The first row of the Excel sheet is expected to be the headers (name, rollno, etc.)
			const jsonData = XLSX.utils.sheet_to_json(worksheet);
                let cidArr = [];
                let hashArr = [];
                const stdDetails = [];
                for (let i=0 ; i<jsonData.length ; i++){
                    let student = jsonData[i];
                    const driveUrl = student.Drive;
                    let cid = await genCid(driveUrl,jwt);
                    cidArr.push(cid);
                    let hash = await computeFileSHA256(await fetchDriveFileAsBlob(driveUrl));
                    hashArr.push(hash);
                    stdDetails.push({
						rollNo: String(student.Roll).trim(), // ✅ Ensure correct type
						name: student.Name.trim(),
						email: student.Email.trim(),
						docHash: "0x" + hash,
						cid: cid
					});

                }
                console.log(stdDetails);
                await uploadMultipleStudents(contractAddress,contractABI,stdDetails);
                
;				

				
				hiddenId.textContent = "Documents uploaded Successfully";
  				hiddenId.className = "success";
                // // Display the JSON data
                // const jsonString = JSON.stringify(jsonData, null, 2); // Pretty print
                // jsonOutput.textContent = jsonString;
                // outputContainer.style.display = 'block';

            } catch (error) {
				hiddenId.textContent = "Failed";
  				hiddenId.className = "error";
                console.error("Error processing file:", error);
                jsonOutput.textContent = 'Error: Could not process the file. Please ensure it is a valid Excel file.';
                outputContainer.style.display = 'block';
            }
        };
		
        reader.onerror = function(error) {
            console.error("File could not be read:", error);
            jsonOutput.textContent = 'Error: Could not read the file.';
            outputContainer.style.display = 'block';
        };

        reader.readAsArrayBuffer(file);
    }
async function genCid(driveurl,jwt) {
    
    let file = await  fetchDriveFileAsBlob(driveurl);
    let cid =  await uploadFileToIPFS(file,jwt);
    return cid;
    
}
async function computeFileSHA256(file) {
    if (!file) throw new Error("No file provided");

    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Compute SHA-256 using Web Crypto API
    const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);

    // Convert hash to hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

    return hashHex;
}
async function uploadFileToIPFS(file, jwt) {
    if (!file) throw new Error("No file provided");
    if (!jwt) throw new Error("No Pinata JWT provided");
	
    const url = "https://api.pinata.cloud/pinning/pinFileToIPFS";
    const formData = new FormData();
    formData.append("file", file);

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${jwt}`,
            },
            body: formData,
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to upload: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();
        // data.IpfsHash contains the CID
        return data.IpfsHash;
    } catch (error) {
		
        console.error("IPFS upload error:", error);
        throw error;
    }
}
function extractFileId(driveLink) {
    const regex = /\/d\/([a-zA-Z0-9_-]+)\//;
    const match = driveLink.match(regex);
    if (!match || !match[1]) throw new Error("Invalid Google Drive link");
    return match[1];
}
async function fetchDriveFileAsBlob(driveUrl) {
    const apiKey = "AIzaSyDZhnHajDtU3QhIR0bsdn_qkzeagyX-pG8"; // add your API key
    const fileId = extractFileId(driveUrl);
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${apiKey}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const blob = await response.blob();
        return blob;
    } catch (error) {
        console.error("Failed to fetch Drive file:", error);
        return null;
    }

}




// Example: connect to MetaMask
async function uploadMultipleStudents(contractAddress, abi, studentsArray) {
    if (!window.ethereum) {
        alert("Please install MetaMask!");
        return;
    }

    // Request access to accounts
    await window.ethereum.request({ method: "eth_requestAccounts" });

    // Provider & signer
    provider = new ethers.providers.Web3Provider(window.ethereum);
    signer = await provider.getSigner();

    // Contract instance
    const contract = new ethers.Contract(contractAddress, abi, signer);

    // Prepare input array in the format expected by Solidity
    // Each student: { rollNo, name, email, docHash, cid }
    const inputs = studentsArray.map(student => ({
        rollNo: student.rollNo,
        name: student.name,
        email: student.email,
        docHash: student.docHash,
        cid: student.cid
    }));

    try {
        const tx = await contract.addMultipleStudentDocuments(inputs);
        console.log("Transaction sent. Waiting for confirmation...");
        const receipt = await tx.wait();
        console.log("Transaction confirmed!", receipt);
		
        return receipt;
    } catch (err) {
        console.error("Error uploading student documents:", err);
        throw err;
    }
}






