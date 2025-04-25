// category groups
const expenseCategories    = [
  "Electricity",
  "Groceries",
  "Rent",
  "Transportation",
  "Entertainment",
  "Other"
];
const investmentCategories = [
  "Roth IRA",
  "Brokerage Account",
  "HYSA",
  "Commodities"
];

let videoStream;

document.getElementById("addBtn").addEventListener("click", () => {
  document.getElementById("addModal").classList.remove("hidden");
});

function closeModal() {
  document.getElementById("addModal").classList.add("hidden");
  stopCamera();
}

function saveTransaction() {
  const category = document.getElementById("categoryInput").value;
  let amt        = parseFloat(document.getElementById("amountInput").value);

  if (!category || isNaN(amt)) {
    alert("Please select a category and enter a valid amount.");
    return;
  }

  // auto-negate expenses so user types only positives
  if (expenseCategories.includes(category)) {
    amt = -Math.abs(amt);
  }

  const txs = JSON.parse(localStorage.getItem("transactions")) || [];
  txs.push({ category, amt });
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
  const txs           = JSON.parse(localStorage.getItem("transactions")) || [];
  const list          = document.getElementById("transactionList");
  const invList       = document.getElementById("investmentList");
  const incomeEl      = document.getElementById("income");
  const expenseEl     = document.getElementById("expenses");
  const balanceEl     = document.getElementById("balance");
  const invBalanceEl  = document.getElementById("investmentBalance");
  const walletEl      = document.getElementById("walletBalance");

  // clear
  list.innerHTML    = "";
  invList.innerHTML = "";

  // totals
  let incomeTotal     = 0;
  let expenseTotal    = 0;
  let investmentTotal = 0;

  txs.forEach((tx, i) => {
    if (investmentCategories.includes(tx.category)) {
      investmentTotal += tx.amt;
      const card = document.createElement("div");
      card.className = "card investment";
      card.innerHTML = `
        <div>
          <strong>${tx.category}</strong><br>
          <small>$${tx.amt.toFixed(2)}</small>
        </div>
        <button onclick="deleteTransaction(${i})">🗑️</button>
      `;
      invList.appendChild(card);

    } else {
      if (tx.amt >= 0) {
        incomeTotal += tx.amt;
      } else {
        expenseTotal += Math.abs(tx.amt);
      }
      const card = document.createElement("div");
      card.className = "card " + (tx.amt >= 0 ? "income" : "expense");
      card.innerHTML = `
        <div>
          <strong>${tx.category}</strong><br>
          <small>$${tx.amt.toFixed(2)}</small>
        </div>
        <button onclick="deleteTransaction(${i})">🗑️</button>
      `;
      list.appendChild(card);
    }
  });

  const balance = incomeTotal - expenseTotal;
  const wallet  = balance - investmentTotal;  // subtract investments here

  // render
  incomeEl.textContent     = "Income: $" + incomeTotal.toFixed(2);
  expenseEl.textContent    = "Expenses: $" + expenseTotal.toFixed(2);
  balanceEl.textContent    = "Balance: $" + balance.toFixed(2);
  invBalanceEl.textContent = "Investments: $" + investmentTotal.toFixed(2);
  walletEl.textContent     = "Wallet: $" + wallet.toFixed(2);
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
        canvas.width  = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext("2d").drawImage(video, 0, 0);
        const imgData = canvas.toDataURL("image/png");

        Tesseract.recognize(imgData, 'eng').then(({ data: { text } }) => {
          const found     = text.match(/\$?\d+(\.\d{2})?/g);
          const lowerText = text.toLowerCase();
          let isIncome  = /income|received|deposit|payment from/.test(lowerText);
          let isExpense = /total|due|amount due|subtotal|paid|amount to pay/.test(lowerText);

          if (found) {
            let value = parseFloat(found[0].replace('$',''));
            if (isExpense)  value = -Math.abs(value);
            if (isIncome)   value = Math.abs(value);
            document.getElementById("amountInput").value = value;
            alert("Detected amount: " + value);
          } else {
            alert("No amount found.");
          }
        });
      };
      modal.appendChild(captureBtn);
    })
    .catch(() => alert("Camera access denied."));
}

function stopCamera() {
  if (videoStream) {
    videoStream.getTracks().forEach(t => t.stop());
    videoStream = null;
  }
  const vid = document.querySelector(".modal-content video");
  if (vid) vid.remove();
  const btn = document.querySelector(".modal-content button:last-child");
  if (btn && btn.innerText === "Capture & Scan") btn.remove();
}

document.getElementById("scanBtn").addEventListener("click", startLiveCameraOCR);
// if you have a search field: 
// document.getElementById("searchInput").addEventListener("input", renderTransactions);

renderTransactions();