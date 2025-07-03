const contractAddress = "YOUR_CONTRACT_ADDRESS"; 
const contractABI = "CONTRACT_ABI";
let provider, signer, contract;
const clgname = document.getElementById("clgname");
const walletaddr = document.getElementById("wltaddr");
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
// On button click
function registerInstitute() {
    connectWalletAndRegister();
}

async function connectWalletAndRegister() {
    if (typeof window.ethereum !== "undefined") {
        try {
            provider = new ethers.providers.Web3Provider(window.ethereum);
            await provider.send("eth_requestAccounts", []);
            signer = provider.getSigner();
            contract = new ethers.Contract(contractAddress, contractABI, signer);
			const connectedwallet = await signer.getAddress();
            console.log("Connected wallet:", connectedwallet);
			const owner = await contract.owner();
			if (owner!=connectedwallet){
				alert ("Only Owner can register Institute !");
				return
			}
            // Proceed to register the institute
            await addInstitute(walletaddr.value,clgname.value);
        } catch (error) {
            console.error("Wallet connection failed:", error);
            alert("Failed to connect wallet. See console for details.");
        }
    } else {
        alert("MetaMask is not installed. Please install it to continue.");
    }
}

async function addInstitute(instituteAddress,clgname) {
    if (!contract) {
        alert("Contract not initialized.");
        return;
    }

    try {
        // Optional: simulate call to check if can be added
        const canAdd = await contract.callStatic.addInstitute(instituteAddress,clgname);

        if (!canAdd) {
            alert("This institute is already added or invalid.");
            return;
        }

        // Send actual transaction
        const tx = await contract.addInstitute(instituteAddress,clgname);
        await tx.wait();
        alert("Institute added successfully!");
    } catch (error) {
        console.error("Error adding institute:", error);
        alert("Transaction failed. See console for details.");
    }
}
