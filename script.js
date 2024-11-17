
// DOM 초기화
document.addEventListener("DOMContentLoaded", () => {
  const startScreen = document.getElementById("start-screen");
  const gameScreen = document.getElementById("game-screen");
  const startButton = document.getElementById("start-button");
  const balanceDisplay = document.getElementById("balance");
  const loanBalanceDisplay = document.getElementById("loan-balance");
  const spinCountDisplay = document.getElementById("spin-count");
  const resultDisplay = document.getElementById("result");
  const betInput = document.getElementById("bet-amount");
  const loanAmountInput = document.getElementById("loan-amount");
  const spinButton = document.getElementById("spin-button");
  const loanButton = document.getElementById("loan-button");
  const repayButton = document.getElementById("repay-button");
  const restartButton = document.getElementById("restart-button");
  const slots = Array.from(document.querySelectorAll(".slot"));

  let balance = 0;
  let loanBalance = 0;
  let spinCount = 0;
  let loanSpinCount = 0; // 대출 이후 스핀 횟수

  const symbols = [
    { icon: "🍎", multiplier: 2 },
    { icon: "🥝", multiplier: 2 },
    { icon: "🍉", multiplier: 2 },
    { icon: "🍇", multiplier: 2 },
    { icon: "🧜", multiplier: 2.5 },
    { icon: "🔔", multiplier: 3 },
    { icon: "⭐", multiplier: 5 },
    { icon: "7⃣", multiplier: 7 },
  ];

  // 게임 시작 버튼
  startButton.addEventListener("click", () => {
    const initialBalance = parseInt(document.getElementById("initial-balance").value);
    if (isNaN(initialBalance) || initialBalance < 10000) {
      alert("초기 자금은 최소 10,000원 이상이어야 합니다.");
      return;
    }

    balance = initialBalance;
    loanBalance = 0;
    spinCount = 0;
    loanSpinCount = 0;

    balanceDisplay.textContent = balance.toLocaleString();
    loanBalanceDisplay.textContent = loanBalance.toLocaleString();
    spinCountDisplay.textContent = spinCount;

    startScreen.style.display = "none";
    gameScreen.style.display = "block";
  });

  // 슬롯 스핀 함수
  function spinSlots() {
    const grid = [];
    for (let i = 0; i < 3; i++) {
      const row = [];
      for (let j = 0; j < 5; j++) {
        const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
        row.push(randomSymbol);
        const slotIndex = i * 5 + j;
        slots[slotIndex].textContent = randomSymbol.icon;
      }
      grid.push(row);
    }
    return grid;
  }

  // 당첨 로직
  function calculatePayout(grid) {
    let totalMultiplier = 1; // 최종 배율
    const winningLines = [];
    const winningSymbols = {}; // 중복 배율 관리

    // 가로 확인 (각 줄의 모든 슬롯이 동일한지 확인)
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j <= 2; j++) { // 가로로 연속된 3개를 확인
        const rowSlice = grid[i].slice(j, j + 3);
        if (rowSlice.every(cell => cell.icon === rowSlice[0].icon)) {
          const symbol = rowSlice[0];
          if (!winningSymbols[symbol.icon]) {
            winningSymbols[symbol.icon] = symbol.multiplier;
          } else {
            winningSymbols[symbol.icon] *= symbol.multiplier; // 중복 배율 곱셈
          }
          winningLines.push({ type: "가로", icon: symbol.icon });
        }
      }
    }

    // 세로 확인
    for (let j = 0; j < 5; j++) {
      const col = grid.map(row => row[j]);
      if (col.every(cell => cell.icon === col[0].icon)) {
        const symbol = col[0];
        if (!winningSymbols[symbol.icon]) {
          winningSymbols[symbol.icon] = symbol.multiplier;
        } else {
          winningSymbols[symbol.icon] *= symbol.multiplier; // 중복 배율 곱셈
        }
        winningLines.push({ type: "세로", icon: symbol.icon });
      }
    }

    // 대각선 확인
    const diag1 = grid.map((row, idx) => row[idx]);
    const diag2 = grid.map((row, idx) => row[4 - idx]);

    const checkDiagonal = (diag, type) => {
      if (diag.every(cell => cell.icon === diag[0].icon)) {
        const symbol = diag[0];
        if (!winningSymbols[symbol.icon]) {
          winningSymbols[symbol.icon] = symbol.multiplier;
        } else {
          winningSymbols[symbol.icon] *= symbol.multiplier; // 중복 배율 곱셈
        }
        winningLines.push({ type, icon: symbol.icon });
      }
    };

    checkDiagonal(diag1, "대각선(↘)");
    checkDiagonal(diag2, "대각선(↙)");

    // 최종 배율 계산
    for (const symbol in winningSymbols) {
      totalMultiplier *= winningSymbols[symbol];
    }

    return { totalMultiplier, winningLines };
  }

  // 스핀 버튼
  spinButton.addEventListener("click", () => {
    const betAmount = parseInt(betInput.value);
    if (isNaN(betAmount) || betAmount > balance) {
      resultDisplay.textContent = "배팅 금액이 잔액을 초과합니다!";
      resultDisplay.style.color = "red";
      return;
    }
    if (betAmount < 10000) {
      resultDisplay.textContent = "배팅 금액은 최소 ₩10,000 이상이어야 합니다!";
      resultDisplay.style.color = "red";
      return;
    }

    balance -= betAmount;
    balanceDisplay.textContent = balance.toLocaleString();

    const grid = spinSlots();
    const { totalMultiplier, winningLines } = calculatePayout(grid);

    // 당첨 여부에 따라 결과 표시
    if (totalMultiplier > 1) {
      const payout = betAmount * totalMultiplier;
      balance += payout;
      resultDisplay.textContent = `🎉 당첨! ${winningLines.map(line => `${line.type}(${line.icon})`).join(", ")} | 배율: ${totalMultiplier.toFixed(2)}배 | 총 배당: ₩${payout.toLocaleString()}`;
      resultDisplay.style.color = "green";
    } else {
      resultDisplay.textContent = "😢 아쉽습니다. 다시 도전하세요!";
      resultDisplay.style.color = "red";
    }

    balanceDisplay.textContent = balance.toLocaleString();
    spinCount++;
    spinCountDisplay.textContent = spinCount;

    if (loanBalance > 0) {
      loanSpinCount++;
      if (loanSpinCount % 10 === 0) {
        const interest = Math.floor(loanBalance * 0.05);
        loanBalance += interest;
        loanBalanceDisplay.textContent = loanBalance.toLocaleString();
        alert(`대출 이자 ₩${interest.toLocaleString()}가 부과되었습니다.`);
      }
    }
  });

  // 대출 버튼
  loanButton.addEventListener("click", () => {
    const loanAmount = parseInt(loanAmountInput.value);
    if (isNaN(loanAmount) || loanAmount < 100000) {
      resultDisplay.textContent = "대출 금액은 최소 ₩100,000 이상이어야 합니다.";
      resultDisplay.style.color = "red";
      return;
    }
    loanBalance += loanAmount;
    balance += loanAmount;
    loanSpinCount = 0;

    balanceDisplay.textContent = balance.toLocaleString();
    loanBalanceDisplay.textContent = loanBalance.toLocaleString();
    resultDisplay.textContent = `대출 완료: ₩${loanAmount.toLocaleString()}`;
    resultDisplay.style.color = "blue";
  });

  // 상환 버튼
  repayButton.addEventListener("click", () => {
    if (loanBalance === 0) {
      resultDisplay.textContent = "상환할 대출이 없습니다.";
      resultDisplay.style.color = "blue";
      return;
    }
    if (balance < loanBalance) {
      resultDisplay.textContent = "잔액이 부족하여 대출을 상환할 수 없습니다.";
      resultDisplay.style.color = "red";
      return;
    }
    balance -= loanBalance;
    loanBalance = 0;

    balanceDisplay.textContent = balance.toLocaleString();
    loanBalanceDisplay.textContent = loanBalance.toLocaleString();
    resultDisplay.textContent = "대출 상환 완료!";
    resultDisplay.style.color = "green";
  });

  // 재시작 버튼
  restartButton.addEventListener("click", () => {
    balance = 0;
    loanBalance = 0;
    spinCount = 0;
    loanSpinCount = 0;

    balanceDisplay.textContent = balance.toLocaleString();
    loanBalanceDisplay.textContent = loanBalance.toLocaleString();
    spinCountDisplay.textContent = spinCount;

    startScreen.style.display = "block";
    gameScreen.style.display = "none";
  });
});
