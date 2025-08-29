document.addEventListener('DOMContentLoaded', async () => {
    // --- CONFIGURATION ---
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

            // If user is the owner, hide the auth layer and load data
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
        fetchStats();
        fetchPendingRequests();
    }

    async function fetchStats() {
        try {
            // Replace with your actual contract function names
            const institutes = await contract.totalInstitutes();
            const documents = await contract.totalDocumentsUploaded();
            const failedAttempts = await contract.fakeVerificationAttempts();

            document.getElementById('total-institutes').textContent = institutes.toString();
            document.getElementById('total-documents').textContent = documents.toString();
            document.getElementById('failed-verifications').textContent = failedAttempts.toString();
        } catch (error) {
            console.error("Failed to fetch stats:", error);
            alert("Could not fetch dashboard statistics.");
        }
    }

    async function fetchPendingRequests() {
        const tbody = document.getElementById('requests-tbody');
        tbody.innerHTML = '<tr><td colspan="3">Loading requests...</td></tr>'; // Loading state

        try {
            // Replace with your contract function to get pending requests
            // This function should return an array of objects/structs
            const requests = await contract.getPendingRequests();

            if (requests.length === 0) {
                tbody.innerHTML = '<tr><td colspan="3">No pending requests.</td></tr>';
                return;
            }

            tbody.innerHTML = ''; // Clear loading state
            requests.forEach(req => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${req.name}</td>
                    <td>${req.instituteAddress}</td>
                    <td>
                        <button class="button primary approve-btn" data-address="${req.instituteAddress}" data-name="${req.name}">
                            Approve
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        } catch (error) {
            console.error("Failed to fetch pending requests:", error);
            tbody.innerHTML = '<tr><td colspan="3" style="color: red;">Error loading requests.</td></tr>';
        }
    }

    // Event listener for approve buttons (using event delegation)
    document.querySelector('.request-table-container').addEventListener('click', async (event) => {
        if (event.target.classList.contains('approve-btn')) {
            const button = event.target;
            const address = button.dataset.address;
            const name = button.dataset.name;

            button.textContent = 'Approving...';
            button.disabled = true;

            try {
                // Replace with your contract function to approve a request
                // This will likely just call your existing addInstitute function
                const tx = await contract.addInstitute(address, name);
                await tx.wait();

                alert(`✅ Institute "${name}" approved successfully!`);
                loadDashboardData(); // Refresh data after approval
            } catch (error) {
                console.error("Approval failed:", error);
                alert("❌ Approval transaction failed. See console for details.");
                button.textContent = 'Approve';
                button.disabled = false;
            }
        }
    });

    init();
});