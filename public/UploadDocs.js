const stdname = document.getElementById("stdname");
const rollno = document.getElementById("rollno");
const email = document.getElementById("email");
const fileinput = document.getElementById("fileInput");
const Status = document.getElementById("status");
const CID = document.getElementById("cid");
const ipfsLink = document.getElementById("ipfslink")
// Update signer when account is changed
async function updateSigner() {
    const accounts = await provider.listAccounts(); // Make sure provider is defined globally
    if (accounts.length > 0) {
        signer = provider.getSigner(accounts[0]);
        const walletaddr = await signer.getAddress();
        console.log("Updated signer to:", walletaddr);
    }
}

// Listen for MetaMask account changes
window.ethereum.on("accountsChanged", async function (accounts) {
    console.log("Account changed to:", accounts[0]);
    await updateSigner();
});

var cid ;
const contractAddress = "YOUR_CONTRACT_ADDRESS"; 
const contractABI = "CONTRACT_ABI";
let provider, signer, contract;
//document.getElementById("formfield").remove();
async function uploadDocs(){
    if(!fileinput.files.length){
        alert ("⚠️ Please select a file first.");
        return;
    }
    const file = fileinput.files[0];
    const formData = new FormData(); // Useful for sending files, blobs, or key-value pairs via fetch or XMLHttpRequest.
    formData.append("file", file);

    if (typeof window.ethereum !== "undefined") {
        try {
            provider = new ethers.providers.Web3Provider(window.ethereum);
            await provider.send("eth_requestAccounts", []);
            signer = provider.getSigner();
            contract = new ethers.Contract(contractAddress, contractABI, signer);
            const walletaddr = await signer.getAddress();
            console.log("Connected wallet:", walletaddr);
            // Assuming you have the contract instance already set up
            const instituteAddress = walletaddr; // Replace with the actual address
            const isApproved = await contract.institutes(instituteAddress);
			//console.log(instituteAddress);
            console.log("Institute status:", isApproved ? "Approved" : "Not approved");
            if (!isApproved){
              alert ("Institute is not registered !")
              return;
            }
            document.getElementById("formfield").remove();
            Status.innerText = "⏳ Uploading to IPFS via Pinata...";
            try {
              const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
                    method: "POST",
                    headers: {
                      Authorization: `Bearer YOUR_PINATA_JWT` // 🔁 Replace this line with your actual JWT
                    },
                    body: formData
              });

              if (!res.ok) {
                throw new Error(`Upload failed: ${res.statusText}`);
              }

              const data = await res.json();
              cid = data.IpfsHash;
              const timestamp = data.Timestamp;
              // Convert to Date object
              const time = new Date(timestamp);

              // Convert to IST
              const istTime = time.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
              Status.innerText = `✅ Upload Successful!  Time : ${istTime}`;
              CID.innerText = `CID: ${cid}`;
              ipfsLink.href = `https://gateway.pinata.cloud/ipfs/${cid}`;
              ipfsLink.innerText = `🔗 View on IPFS`;
              console.log("Upload success: ", data, " Time : ",time);
            } catch (error) {
              console.error(error);
              Status.innerText = "❌ Upload Failed!";
            }
            const hash = await getFileHash(file);
            console.log(hash);
            await addStudentData(rollno.value,stdname.value,email.value,"0x"+hash,cid);
            
        } catch (error) {
            console.error("Wallet connection failed:", error);
            alert("Failed to connect wallet. See console for details.");
            return;
        }
    } else {
        alert("MetaMask is not installed. Please install it to continue.");
        return;
    }    
}
async function getFileHash(file) {
    // Read the file as an ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Generate SHA-256 hash
    const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);

    // Convert ArrayBuffer to hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}
async function addStudentData(rollNo,name,email,hash,cid) {
    if (!contract) {
        alert("Contract not initialized.");
        return;
    }

    try {
        // Optional: simulate call to check if can be added
        const canAdd = await contract.callStatic.addStudentDocument(rollNo,name,email,hash,cid);
		console.log(canAdd);
        if (!canAdd) {
            alert("College is not registered. Register first");
            return;
        }
        // Send actual transaction
        const tx = await contract.addStudentDocument(rollNo,name,email,hash,cid);
        await tx.wait();
        const info = await contract.getStudentInfo(rollNo);
        console.log(info);
        alert("Student data added successfully!");
    } catch (error) {
        console.error("Error adding institute:", error);
        alert("Transaction failed. See console for details.");
    }
}

