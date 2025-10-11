const stdname = document.getElementById("stdname");
const rollNo = document.getElementById("rollno");
var res = false;
const contractAddress = "YOUR_CONTRACT_ADDRESS"; 
const contractABI = "CONTRACT_ABI";
console.log(contractAddress);
let email1;
let provider, signer, contract;

const studentForm = document.getElementById("student-form");
const otpForm = document.getElementById("otp-form");
const stddetail = document.getElementById("stddetail");


studentForm.addEventListener("submit", async (e) => {
    e.preventDefault(); // prevent form submission
    await getDocs();
});

otpForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    await checkOTP();
});



async function getDocs() {
    if (typeof window.ethereum === "undefined") {
        alert("MetaMask is not installed. Please install it to continue.");
        return;
    }

    try {
        provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        signer = provider.getSigner();
        contract = new ethers.Contract(contractAddress, contractABI, signer);

        const walletaddr = await signer.getAddress();
        console.log("Connected wallet:", walletaddr);

        const [isok, cids] = await contract.callStatic.getDocumentCIDs(rollNo.value);
        if (!isok) {
            alert("❌ Roll number not found!");
            return;
        }
        if (cids.length === 0) {
            alert("No Documents found");
            return;
        }

        const [found, name, email, Instituteaddress, len] = await contract.callStatic.getStudentInfo(rollNo.value);
    
		email1 = email; // ✅ save for later
		console.log("Student Email:", email1);

		studentForm.classList.add("hidden");
		otpForm.classList.remove("hidden");
		
		await sendOTP(email1);
    } catch (error) {
        console.error("Wallet connection failed:", error);
        alert("Failed to connect wallet. See console for details.");
    }
}

async function sendOTP(email) {
    try {
        const res = await fetch("http://localhost:5000/send-otp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email })
        });
        const data = await res.json();
        alert(data.message || "OTP sent to your email.");
    } catch (error) {
        console.error("Error sending OTP:", error);
        alert("❌ Failed to send OTP.");
    }
}

async function verifyOTP(email) {
    const otp = document.getElementById("otp-input").value.trim();
    if (!otp) {
        alert("⚠️ Please enter the OTP.");
        return false;
    }
    try {
        const response = await fetch("http://localhost:5000/verify-otp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, otp })
        });
        const data = await response.json();
		if (data.success===false){
			alert(data.message);
		}
        // alert(data.message);
        return data.success === true;
    } catch (error) {
        console.error(error);
        alert("❌ OTP Verification failed due to network or server error.");
        return false;
    }
}

async function checkOTP() {
    const isVerified = await verifyOTP(email1);
    if (isVerified) {
        otpForm.remove();
        await getDocs1();
    }
}
async function getDocs1() {
    try {
        const [isok, cids] = await contract.callStatic.getDocumentCIDs(rollNo.value);
        const [found, name, email, Instituteaddress, len] = await contract.callStatic.getStudentInfo(rollNo.value);
        const container = document.querySelector(".form-container");
        container.innerHTML = "";

        const clgname = await contract.instituteNames(Instituteaddress);
        container.innerHTML += `
            <h2>Student Details</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Roll Number:</strong> ${rollNo.value}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Institute:</strong> ${clgname}</p>
            <p><strong>Institute Address:</strong> ${Instituteaddress.slice(0, 6)}....</p>
            <h3>Documents:</h3>
        `;

        for (let i = 0; i < len; i++) {
            const link = document.createElement("a");
            link.href = `https://gateway.pinata.cloud/ipfs/${cids[i]}`;
            link.textContent = `Document ${i + 1}`;
            link.target = "_blank";
            link.download = `Document_${i + 1}`;
            container.appendChild(link);
            container.appendChild(document.createElement("br"));
        }

        console.log("✅ Documents found:", cids);
    } catch (error) {
        console.error("Error fetching documents:", error);
        alert("Failed to fetch documents. See console for details.");
    }
}



