let videoStream;

document.getElementById("addBtn").addEventListener("click", () => {
  document.getElementById("addModal").classList.remove("hidden");
});

function closeModal() {
  document.getElementById("addModal").classList.add("hidden");
  stopCamera();
}

function saveTransaction() {
  const desc = document.getElementById("descInput").value;
  const amt = parseFloat(document.getElementById("amountInput").value);
  if (!desc || isNaN(amt)) return;

  const txs = JSON.parse(localStorage.getItem("transactions")) || [];
  txs.push({ desc, amt });
  localStorage.setItem("transactions", JSON.stringify(txs));
  renderTransactions();
  closeModal();
}

function deleteTransaction(index) {
  const txs = JSON.parse(localStorage.getItem("transactions")) || [];
  txs.splice(index, 1);
  localStorage.setItem("transactions", JSON.stringify(txs));
  renderTransactions();
}

function renderTransactions() {
  const txs = JSON.parse(localStorage.getItem("transactions")) || [];
  const list = document.getElementById("transactionList");
  const balanceEl = document.getElementById("balance");
  list.innerHTML = "";

  let balance = 0;
  txs.forEach((tx, i) => {
    balance += tx.amt;
    const card = document.createElement("div");
    card.className = "card " + (tx.amt >= 0 ? "income" : "expense");
    card.innerHTML = `
      <div>
        <strong>${tx.desc}</strong><br>
        <small>${tx.amt.toFixed(2)}</small>
      </div>
      <button onclick="deleteTransaction(${i})">🗑️</button>
    `;
    list.appendChild(card);
  });
  balanceEl.textContent = "Balance: $" + balance.toFixed(2);
}

function startLiveCameraOCR() {
  const video = document.createElement("video");
  video.autoplay = true;
  video.style.width = "100%";
  video.style.maxHeight = "240px";
  const modal = document.querySelector(".modal-content");
  modal.appendChild(video);

  navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
    .then(stream => {
      video.srcObject = stream;
      videoStream = stream;

      const captureBtn = document.createElement("button");
      captureBtn.innerText = "Capture & Scan";
      captureBtn.onclick = () => {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext("2d").drawImage(video, 0, 0);
        const imgData = canvas.toDataURL("image/png");

        Tesseract.recognize(imgData, 'eng').then(({ data: { text } }) => {
          const found = text.match(/\$?\d+(\.\d{2})?/g);
          const textLower = text.toLowerCase();
          let isIncome = /income|received|deposit|payment from/.test(textLower);
          let isExpense = /total|due|amount due|subtotal|paid|amount to pay/.test(textLower);

          if (found) {
            let value = parseFloat(found[0].replace('$', ''));
            if (isExpense) value = -Math.abs(value);
            if (isIncome) value = Math.abs(value);
            document.getElementById("amountInput").value = value;
            alert("Detected amount: " + value);
          } else {
            alert("No amount found.");
          }
        });
      };
      modal.appendChild(captureBtn);
    })
    .catch(err => alert("Camera access denied."));
}

function stopCamera() {
  if (videoStream) {
    videoStream.getTracks().forEach(track => track.stop());
    videoStream = null;
  }
  const video = document.querySelector(".modal-content video");
  if (video) video.remove();
  const btn = document.querySelector(".modal-content button:last-child");
  if (btn && btn.innerText === "Capture & Scan") btn.remove();
}

document.getElementById("scanBtn").addEventListener("click", startLiveCameraOCR);
document.getElementById("searchInput").addEventListener("input", renderTransactions);

renderTransactions();
