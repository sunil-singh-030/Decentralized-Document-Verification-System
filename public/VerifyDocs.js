const stdName = document.getElementById("stdname");
const rollNo = document.getElementById("rollno");
const fileinput = document.getElementById("fileInput");
const contractAddress = "YOUR_CONTRACT_ADDRESS"; 
const contractABI = "CONTRACT_ABI";
let provider, signer, contract;
async function verifyDocs(){
    console.log(rollNo.value);
    if(!fileinput.files.length){
        alert ("⚠️ Please select a file first.");
        return;
    }
    const file = fileinput.files[0];
    const formData = new FormData(); // Useful for sending files, blobs, or key-value pairs via fetch or XMLHttpRequest.
    formData.append("file", file);
    const hash = await getFileHash(file);
    console.log(hash);
    if (typeof window.ethereum !== "undefined") {
        try {
            provider = new ethers.providers.Web3Provider(window.ethereum);
            await provider.send("eth_requestAccounts", []);
            signer = provider.getSigner();
            contract = new ethers.Contract(contractAddress, contractABI, signer);
            const walletaddr = await signer.getAddress();
            console.log("Connected wallet:", walletaddr);
            
            document.getElementById("formfield").remove();
            document.getElementById("verify-status").innerText = "Processing file ....";
            const [isok, cid] = await contract.callStatic.verifyDocument(rollNo.value, "0x" + hash);
            const status = document.getElementById("verify-status");
            if (!isok) {
                alert("⚠️ Roll number or file doesn't exist!");
                status.innerText = ` Not verified  `;
                status.style.color = "red";
                status.style.textAlign = "center";
                return;
            } else {
                alert("✅ Document verified!\nCID: " + cid);
                status.innerText = `Verified  : 📄 `;
                status.style.color = "green";
                const ipfsLink = document.getElementById("ipfslink");
                ipfsLink.href = `https://gateway.pinata.cloud/ipfs/${cid}`;
                ipfsLink.textContent = "  View Verified Document";
                ipfsLink.style.display = "inline"; // 👈 ensure it's visible
                return;
            }


            
            
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