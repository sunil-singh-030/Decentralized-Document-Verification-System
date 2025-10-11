
const contractAddress = "YOUR_CONTRACT_ADDRESS";
const contractABI = "YOUR_CONTRACT_ABI"; // Make sure ABI is a valid JSON string or object
let provider, signer, contract;

const authLayer = document.getElementById('admin-auth-layer');
const authMessage = document.getElementById('auth-message');

async function init() {
    if (typeof window.ethereum === "undefined") {
        showAuthError("MetaMask is not installed. Please install it to continue.");
        return;
    }
    try {
        provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        signer = provider.getSigner();
        contract = new ethers.Contract(contractAddress, contractABI, signer);

        const connectedAddress = await signer.getAddress();
        const ownerAddress = await contract.owner();

        if (ethers.utils.getAddress(connectedAddress) !== ethers.utils.getAddress(ownerAddress)) {
            showAuthError("Access Denied: You are not the contract owner.");
            return;
        }

        authLayer.style.display = 'none';
        loadDashboardData();

    } catch (error) {
        console.error("Initialization failed:", error);
        showAuthError("Failed to connect wallet or contract. See console for details.");
    }
}

function showAuthError(message) {
    authMessage.textContent = message;
    authMessage.classList.add('error');
}

async function loadDashboardData() {
    await fetchStats();
    await fetchInstituteDetails();
}

// ---------------- Fetch Stats ----------------
async function fetchStats() {
    try {
        const totalInstitutes = await contract.getTotalInstitutes();
        const totalDocuments = await contract.getTotalDocuments();
        const totalStudents = await contract.getTotalStudents();

        document.getElementById('total-institutes').textContent = totalInstitutes.toString();
        document.getElementById('total-documents').textContent = totalDocuments.toString();
        document.getElementById('total-students').textContent = totalStudents.toString();
    } catch (error) {
        console.error("Failed to fetch stats:", error);
        alert("Could not fetch dashboard statistics.");
    }
}

// ---------------- Fetch Institute Details ----------------
async function fetchInstituteDetails() {
    const tbody = document.getElementById('requests-tbody');
    tbody.innerHTML = '<tr><td colspan="3">Loading institutes...</td></tr>';

    try {
        const institutes = await contract.getAllInstitutes();
        tbody.innerHTML = "";

        if (institutes.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3">No institutes registered.</td></tr>';
            return;
        }

        // ----------------- Filter duplicates by wallet -----------------
        const uniqueInstitutes = Array.from(
            new Map(institutes.map(inst => [inst.wallet, inst])).values()
        );

        uniqueInstitutes.forEach(inst => {
            const btnText = inst.isActive ? "Deactivate" : "Activate";
            const btnClass = inst.isActive ? "deactivate-btn" : "activate-btn";

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${inst.name}</td>
                <td>${inst.wallet}</td>
                <td>
                    <button class="${btnClass}" data-wallet="${inst.wallet}">${btnText}</button>
                </td>
            `;
            tbody.appendChild(row);
        });

        // Add click event listeners for all buttons
        document.querySelectorAll('#requests-tbody button').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const wallet = e.target.dataset.wallet;
                e.target.disabled = true;
                e.target.textContent = "Processing...";

                try {
                    if (e.target.classList.contains('deactivate-btn')) {
						const tx = await contract.revokeInstitute(wallet);
						await tx.wait();
						alert(`✅ Institute revoked successfully`);
					} else {
						// Reactivate institute without calling addInstitute()
						const tx = await contract.reactivateInstitute(wallet); // create this function in Solidity
						await tx.wait();
						alert(`✅ Institute reactivated successfully`);
					}

					// Refresh table after update
					fetchInstituteDetails();
                } catch (error) {
                    console.error("Status update failed:", error);
                    alert("❌ Transaction failed. See console for details.");
                    e.target.disabled = false;
                    e.target.textContent = e.target.classList.contains('deactivate-btn') ? "Deactivate" : "Activate";
                }
            });
        });

    } catch (error) {
        console.error("Failed to fetch institutes:", error);
        tbody.innerHTML = '<tr><td colspan="3" style="color:red;">Error loading institutes</td></tr>';
    }
}


// ---------------- Initialize ----------------
init();
