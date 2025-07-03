const stdname = document.getElementById("stdname");
const rollNo = document.getElementById("rollno");
var res = false;
const contractAddress = "YOUR_CONTRACT_ADDRESS"; 
const contractABI = "CONTRACT_ABI";
var email1;
let provider, signer, contract;
async function getDocs(){
    if (typeof window.ethereum !== "undefined") {
        try {
            provider = new ethers.providers.Web3Provider(window.ethereum);
            await provider.send("eth_requestAccounts", []);
            signer = provider.getSigner();
            contract = new ethers.Contract(contractAddress, contractABI, signer);
            const walletaddr = await signer.getAddress();
            console.log("Connected wallet:", walletaddr);
            
            const [isok, cids] = await contract.callStatic.getDocumentCIDs(rollNo.value);
            if (!isok) {
                    alert("❌ Roll number not found !");
            } else if(cids.length==0){
                    alert("No Documents found")
            }
            else {
				document.getElementById("formfield").remove();
                const [found,name,email,Instituteaddress,len] = await contract.callStatic.getStudentInfo(rollNo.value);
				email1 = email;
      			document.getElementById('verifyotp').classList.remove('hidden');
				await sendOTP(email);
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
async function sendOTP(email) {
	const res = await fetch('http://localhost:5000/send-otp', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ email })
	});
	const data = await res.json();
	alert(data.message);
}

async function verifyOTP(email) {
	const otp = document.getElementById('otp').value;
	try {
		const response = await fetch('http://localhost:5000/verify-otp', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email, otp })
		});
		const data = await response.json();
		alert(data.message);

		// Set the global variable 'res' based on server response
		res = data.success === true; // assuming your backend sends { success: true/false }
	} catch (error) {
		alert("❌ OTP Verification failed due to network or server error.");
		console.error(error);
		res = false;
	}
}
async function checkOTP() {
	console.log("hi");
	console.log("Using email for OTP verification:", email1);
	await verifyOTP(email1);
	console.log("OTP verification result:", res); // res is now set
	if (res==true){
		document.getElementById('verifyotp').remove();
		await getDocs1();
	}
}
async function getDocs1(){
	if (typeof window.ethereum !== "undefined") {
		try {
			provider = new ethers.providers.Web3Provider(window.ethereum);
			await provider.send("eth_requestAccounts", []);
			signer = provider.getSigner();
			contract = new ethers.Contract(contractAddress, contractABI, signer);
			const walletaddr = await signer.getAddress();
			console.log("Connected wallet:", walletaddr);
			
			
			
			const [isok, cids] = await contract.callStatic.getDocumentCIDs(rollNo.value);
			
			
			const [found,name,email,Instituteaddress,len] = await contract.callStatic.getStudentInfo(rollNo.value);
			const container = document.querySelector(".getdocs");
			container.innerHTML = ""; // Clear any previous content
			const clgname = await contract.instituteNames(Instituteaddress);
			const infoHtml = `
				<h2>Student Details</h2>
				<p><strong>Name:</strong> ${name}</p>
				<p><strong>Roll Number:</strong> ${rollNo.value}</p>
				<p><strong>Email:</strong> ${email}</p>
				<p><strong>Institute:</strong> ${clgname}</p>
				<p><strong>Institute Address:</strong> ${Instituteaddress.slice(0,6)+"...."}</p>
				<h3>Documents:</h3>
			`;
			container.innerHTML += infoHtml;

			// Append each document link with serial number
			for (var i=1 ; i<=len ; i++){
				console.log(cids[i-1]);
				const link = document.createElement("a");
				link.href = `https://gateway.pinata.cloud/ipfs/${cids[i-1]}`;
				link.textContent = `Document ${i}`;
				link.target = "_blank";
				container.appendChild(link);
				container.appendChild(document.createElement("br"));
			};
			
			console.log("✅ Documents found:", cids[0]);
			
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


