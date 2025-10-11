const contractAddress = "YOUR_CONTRACT_ADDRESS"; 
const contractABI = "CONTRACT_ABI";
let provider, signer, contract;

// Get DOM elements
const clgnameInput = document.getElementById("clgname");
const walletaddrInput = document.getElementById("wltaddr");
const emailInput = document.getElementById("email");
const statusMessage = document.getElementById("status-message");
const registerForm = document.getElementById("register-form");
const registerButton = document.querySelector(".button.primary");

// ---------------------- MetaMask and Signer ----------------------
async function updateSigner() {
    const accounts = await provider.listAccounts();
    if (accounts.length > 0) {
        signer = provider.getSigner(accounts[0]);
        const signerAddress = await signer.getAddress();
        statusMessage.innerText = `Connected wallet: ${signerAddress}`;
    } else {
        signer = null;
        statusMessage.innerText = "No wallet connected.";
    }
}

if (window.ethereum) {
    window.ethereum.on("accountsChanged", async (accounts) => {
        console.log("Account changed to:", accounts[0]);
        await updateSigner();
    });
}

// ---------------------- Form Submission ----------------------
registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    registerButton.disabled = true;
    registerButton.innerText = "Registering...";
    statusMessage.innerText = "Connecting wallet...";

    await connectWalletAndRegister();

    registerButton.disabled = false;
    registerButton.innerText = "Register Institute";
});

// ---------------------- Wallet Connection and Registration ----------------------
async function connectWalletAndRegister() {
    if (typeof window.ethereum === "undefined") {
        alert("MetaMask is not installed. Please install it to continue.");
        statusMessage.innerText = "MetaMask not detected.";
        return;
    }

    try {
        provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        signer = provider.getSigner();
        contract = new ethers.Contract(contractAddress, contractABI, signer);

        const connectedWallet = await signer.getAddress();
        statusMessage.innerText = `Connected wallet: ${connectedWallet}`;

        // Only owner can register
        const owner = await contract.owner();
        if (owner.toLowerCase() !== connectedWallet.toLowerCase()) {
            alert("Only the owner can register an institute!");
            statusMessage.innerText = "Access denied: not contract owner.";
            return;
        }

        // Validate inputs before sending
        const validationError = validateFormInputs();
        if (validationError) {
            statusMessage.innerText = validationError;
            registerButton.disabled = false;
            registerButton.innerText = "Register Institute";
            return;
        }

        // Proceed with contract call
        await addInstitute(walletaddrInput.value, clgnameInput.value, emailInput.value);

    } catch (error) {
        console.error("Wallet connection failed:", error);
        alert("Failed to connect wallet. See console for details.");
        statusMessage.innerText = "Wallet connection failed.";
    }
}

// ---------------------- Input Validation ----------------------
function validateFormInputs() {
    const wallet = walletaddrInput.value.trim();
    const name = clgnameInput.value.trim();
    const emailValue = emailInput.value.trim();

    // Empty fields
    if (!wallet || !name || !emailValue) return "All fields are required.";

    // Wallet address format
    if (!ethers.utils.isAddress(wallet)) return "Invalid wallet address.";

    // Email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailValue)) return "Invalid email address.";

    return null; // No error
}

// ---------------------- Add Institute ----------------------
async function addInstitute(instituteAddress, instituteName, clgEmail) {
    if (!contract) {
        alert("Contract not initialized.");
        statusMessage.innerText = "Contract not initialized.";
        return;
    }

    try {
        // ✅ Check if already registered using getInstituteInfo
        const instituteInfo = await contract.getInstituteInfo(instituteAddress);
        const isRegistered = instituteInfo[0]; // first bool in tuple

        if (isRegistered) {
            alert("❌ This institute is already registered!");
            statusMessage.innerText = "Institute already registered.";
            return;
        }

        // If not registered, proceed with transaction
        statusMessage.innerText = "Sending transaction...";
        const tx = await contract.addInstitute(instituteAddress, instituteName, clgEmail);
        await tx.wait();

        statusMessage.innerText = `✅ Institute "${instituteName}" added successfully!`;
        alert(`Institute "${instituteName}" added successfully!`);

        // Clear input fields
        clgnameInput.value = "";
        walletaddrInput.value = "";
        emailInput.value = "";

    } catch (error) {
        console.error("Error adding institute:", error);

        // Check if revert reason exists
        let reason = "Transaction failed.";
        if (error.error && error.error.message) {
            reason = error.error.message;
        } else if (error.reason) {
            reason = error.reason;
        } else if (error.data && error.data.message) {
            reason = error.data.message;
        }

        statusMessage.innerText = `❌ ${reason}`;
        alert(`Error: ${reason}`);
    }
}


