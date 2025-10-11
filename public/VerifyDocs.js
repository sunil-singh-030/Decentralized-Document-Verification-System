const stdName = document.getElementById("stdname");
const rollNo = document.getElementById("rollno");
const fileinput = document.getElementById("fileInput");
const fileNameSpan = document.getElementById("fileName");
const contractAddress = "YOUR_CONTRACT_ADDRESS"; 
const contractABI = "CONTRACT_ABI";
let provider, signer, contract;
// Update file name when user selects one
fileinput.addEventListener("change", () => {
    fileNameSpan.textContent = fileinput.files.length ? fileinput.files[0].name : "No file selected";
});

document.getElementById("verify-form").addEventListener("submit", async (e) => {
    e.preventDefault(); // stop page reload
    await verifyDocs();
});

async function verifyDocs() {
    console.log("Roll No:", rollNo.value);

    if (!fileinput.files.length) {
        alert("⚠️ Please select a file first.");
        return;
    }

    const file = fileinput.files[0];
    const hash = await getFileHash(file);
    console.log("File Hash:", hash);

    if (typeof window.ethereum !== "undefined") {
        try {
            provider = new ethers.providers.Web3Provider(window.ethereum);
            await provider.send("eth_requestAccounts", []);
            signer = provider.getSigner();
            contract = new ethers.Contract(contractAddress, contractABI, signer);

            const walletaddr = await signer.getAddress();
            console.log("Connected wallet:", walletaddr);

            const status = document.getElementById("verify-status");
            status.innerText = "Processing file ....";
            status.style.color = "orange";
            status.style.textAlign = "center";
			

            const [isok, cid] = await contract.callStatic.verifyDocument(
                rollNo.value,
                "0x" + hash
            );

            if (!isok) {
                alert("⚠️ Roll number or file doesn't exist!");
                status.innerText = `Not Verified ❌`;
                status.style.color = "red";
                return;
            } else {
                alert("✅ Document verified!\nCID: " + cid);
                status.innerText = `Verified ✅`;
                status.style.color = "green";

                const ipfsLink = document.getElementById("ipfslink");
                ipfsLink.href = `https://gateway.pinata.cloud/ipfs/${cid}`;
                ipfsLink.textContent = "📄 View Verified Document";
                ipfsLink.style.display = "inline";
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
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
    return hashHex;
}
