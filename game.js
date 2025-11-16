
(() => {
  // === Canvas & DOM ===
  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const nitroMeterEl = document.getElementById('nitroMeter');
  const speedEl = document.getElementById('speed');
  const popup = document.getElementById('popup');
  const questionText = document.getElementById('questionText');
  const answerInput = document.getElementById('answerInput');
  const submitBtn = document.getElementById('submitAnswer');
  const giveUpBtn = document.getElementById('giveUp');
  const popupContent = document.getElementById('popupContent');

  // === Game State ===
  const roadWidth = 260;
  const laneCount = 3;
  const laneWidth = roadWidth / laneCount;
  const roadX = (W - roadWidth) / 2;

  const player = {
    x: roadX + laneWidth * 1 + laneWidth / 2 - 18,
    y: H - 110,
    w: 36,
    h: 70
  };

  let enemies = [];
  let spawnTimer = 0;
  let spawnInterval = 900; // ms
  let difficultyTime = 0;

  let roadOffset = 0;
  let baseSpeed = 2.7;
  let currentSpeed = baseSpeed;
  let nitro = 60; // 0–100
  let running = true;
  let inQuestion = false;
  let score = 0;
  let best = 0;
  let lastTime = performance.now();
  let currentQuestion = null;
  let shieldActive = false;
  let shieldTimer = 0;

  let freePass = 0; // số lượt miễn sai
  let items = [];

  // === Load best score from localStorage (nếu có) ===
  try {
    const saved = localStorage.getItem('ne-xe-best');
    if (saved) best = parseInt(saved, 10) || 0;
  } catch (e) {
    // ignore if localStorage bị chặn
  }
  bestEl.textContent = best.toString();
const ITEM_TYPES = {
  SHIELD: "shield",
  FREEPASS: "freepass"
};

  // === Question Bank (đã rút gọn & SẠCH LỖI NHÁY) ===
  const questions = [
    // Phương trình / đại số
    { q: 'Giải PT: x^2 - 5x + 6 = 0. Tính x1 + x2?', a: '5' },
    { q: 'Giải PT: x^2 - 17x + 72 = 0. Tính x1 + x2?', a: '17' },
    { q: 'Giải PT: x^2 - 10x + 16 = 0. Tính x1 * x2?', a: '16' },
    { q: 'Giải PT: 2x - 5 = 9. Tính x?', a: '7' },
    { q: 'Giải PT: 3x + 4 = 1. Tính x?', a: '-1' },
    {q: 'Tính đạo hàm f(x)=x^2', a: '2x'},
  {q: 'Tính đạo hàm f(x)=3x^3 + 5x', a: '9x^2 + 5'},
  {q: 'Tính đạo hàm f(x)=7', a: '0'},
  {q: 'Tính đạo hàm f(x)=2x^5 - x^3 + 4', a: '10x^4 - 3x^2'},
  {q: 'Tính đạo hàm f(x)=sin(x)', a: 'cos(x)'},
  {q: 'Tính đạo hàm f(x)=cos(x)', a: '-sin(x)'},
  {q: 'Tính đạo hàm f(x)=e^x', a: 'e^x'},
  {q: 'Tính đạo hàm f(x)=2e^(3x)', a: '6e^(3x)'},
  {q: 'Tính đạo hàm f(x)=ln(x)', a: '1/x'},
  {q: 'Tính đạo hàm f(x)=log_3(2) + 9x^2', a: '18x'},
  {q: 'Tính đạo hàm f(x)=5x^4 + 3x^2 - 2x + 7', a: '20x^3 + 6x - 2'},
  {q: 'Tính đạo hàm f(x)=x^7', a: '7x^6'},
  {q: 'Tính đạo hàm f(x)=x^3 + 4x', a: '3x^2 + 4'},
  {q: 'Tính đạo hàm f(x)=sin(2x)', a: '2cos(2x)'},
  {q: 'Tính đạo hàm f(x)=cos(5x)', a: '-5sin(5x)'},
  {q: 'Tính đạo hàm f(x)=e^(2x) + 3x', a: '2e^(2x) + 3'},
  {q: 'Tính đạo hàm f(x)=ln(3x)', a: '1/x'},
  {q: 'Tính đạo hàm f(x)=x^2 + x + 1', a: '2x + 1'},
  {q: 'Tính đạo hàm f(x)=x^5 - 2x^2 + 3x', a: '5x^4 - 4x + 3'},
  {q: 'Tính đạo hàm f(x)=7x^3 + 2', a: '21x^2'},
  {q: 'Tính đạo hàm f(x)=x^4 - x^3 + x^2 - x + 1', a: '4x^3 - 3x^2 + 2x - 1'},
  {q: 'Tính đạo hàm f(x)=5sin(x) - 3cos(x)', a: '5cos(x) + 3sin(x)'},
  {q: 'Tính đạo hàm f(x)=2ln(x) + x^2', a: '2/x + 2x'},
  {q: 'Tính đạo hàm f(x)=e^(x^2)', a: '2xe^(x^2)'},
  {q: 'Tính đạo hàm f(x)=ln(x^2 + 1)', a: '2x/(x^2 + 1)'},
  {q: 'Tính đạo hàm f(x)=sin(x^2)', a: '2x cos(x^2)'},
  {q: 'Tính đạo hàm f(x)=cos(x^2)', a: '-2x sin(x^2)'},
  {q: 'Tính đạo hàm f(x)=3x^3 + 4x^2 - 5x + 6', a: '9x^2 + 8x - 5'},
  {q: 'Tính đạo hàm f(x)=log_2(x)', a: '1/(x ln2)'},
  {q: 'Tính đạo hàm f(x)=x^2 sin(x)', a: '2x sin(x) + x^2 cos(x)'},
  {q: 'Tính đạo hàm f(x)=x^3 cos(x)', a: '3x^2 cos(x) - x^3 sin(x)'},
  {q: 'Tính đạo hàm f(x)=e^(3x) sin(x)', a: '3e^(3x) sin(x) + e^(3x) cos(x)'},
  {q: 'Tính đạo hàm f(x)=e^x ln(x)', a: 'e^x ln(x) + e^x/x'},
  {q: 'Tính đạo hàm f(x)=1/x', a: '-1/x^2'},
  {q: 'Tính đạo hàm f(x)=x^4 ln(x)', a: '4x^3 ln(x) + x^3'},
  {q: 'Tính đạo hàm f(x)=tan(x)', a: 'sec^2(x)'},
  {q: 'Tính đạo hàm f(x)=x tan(x)', a: 'tan(x) + x sec^2(x)'},
  {q: 'Tính đạo hàm f(x)=cot(x)', a: '-csc^2(x)'},
  {q: 'Tính đạo hàm f(x)=x cot(x)', a: 'cot(x) - x csc^2(x)'},
  {q: 'Tính đạo hàm f(x)=arcsin(x)', a: '1/sqrt(1-x^2)'},
  {q: 'Tính đạo hàm f(x)=arccos(x)', a: '-1/sqrt(1-x^2)'},
  {q: 'Tính đạo hàm f(x)=arctan(x)', a: '1/(1+x^2)'},
  {q: 'Tính đạo hàm f(x)=x arctan(x)', a: 'arctan(x) + x/(1+x^2)'},
  {q: 'Tính đạo hàm f(x)=ln(x) / x', a: '(1 - ln(x))/x^2'},
  {q: 'Tính đạo hàm f(x)=x^2 e^x', a: '2x e^x + x^2 e^x'},
  {q: 'Tính đạo hàm f(x)=e^(-x^2)', a: '-2x e^(-x^2)'},
  {q: 'Tính đạo hàm f(x)=x^3 + sin(x) + ln(x)', a: '3x^2 + cos(x) + 1/x'},
  {q: 'Tính đạo hàm f(x)=x^4 + 5x^3 - 2x + 1', a: '4x^3 + 15x^2 - 2'},
  {q: 'Tính đạo hàm f(x)=sqrt(x)', a: '1/(2sqrt(x))'},
  {q: 'Tính đạo hàm f(x)=x sqrt(x)', a: '3/2 sqrt(x)'},
  {q: 'Tính đạo hàm f(x)=x^2 sqrt(x)', a: '(5/2)x^(3/2)'},
  {q: 'Tính đạo hàm f(x)=x^3 sqrt(x)', a: '(7/2)x^(5/2)'},
  {q: 'Tính đạo hàm f(x)=sin(x) + cos(x) + e^x', a: 'cos(x) - sin(x) + e^x'},
  {q: 'Tính đạo hàm f(x)=2x^2 + 3x + 1', a: '4x + 3'},
  {q: 'Tính đạo hàm f(x)=x^5 - 4x^3 + x', a: '5x^4 - 12x^2 + 1'},
  {q: 'Tính đạo hàm f(x)=ln(x+1)', a: '1/(x+1)'},
  {q: 'Tính đạo hàm f(x)=e^(x+2)', a: 'e^(x+2)'},
  {q: 'Tính đạo hàm f(x)=sin(3x)', a: '3cos(3x)'},
  {q: 'Tính đạo hàm f(x)=cos(2x)', a: '-2sin(2x)'},
  {q: 'Tính đạo hàm f(x)=x^3 + 2x^2 - 5', a: '3x^2 + 4x'},
  {q: 'Tính đạo hàm f(x)=5x + 7', a: '5'},
  {q: 'Tính đạo hàm f(x)=x^2 sin(x) + cos(x)', a: '2x sin(x) + x^2 cos(x) - sin(x)'},
  {q: 'Tính đạo hàm f(x)=x^3 cos(x) - sin(x)', a: '3x^2 cos(x) - x^3 sin(x) - cos(x)'},
  {q: 'Tính đạo hàm f(x)=x e^x', a: 'e^x + x e^x'},
  {q: 'Tính đạo hàm f(x)=x ln(x)', a: '1 + ln(x)'},
  {q: 'Tính đạo hàm f(x)=x^2 ln(x)', a: '2x ln(x) + x'},
  {q: 'Tính đạo hàm f(x)=arctan(2x)', a: '2/(1+4x^2)'},
  {q: 'Tính đạo hàm f(x)=arcsin(x^2)', a: '2x/sqrt(1-x^4)'},
  {q: 'Tính đạo hàm f(x)=arccos(3x)', a: '-3/sqrt(1-9x^2)'},
  {q: 'Tính đạo hàm f(x)=tan(2x)', a: '2 sec^2(2x)'},
  {q: 'Tính đạo hàm f(x)=cot(3x)', a: '-3 csc^2(3x)'},
  {q: 'Tính đạo hàm f(x)=x^4 + e^x + sin(x)', a: '4x^3 + e^x + cos(x)'},
  {q: 'Tính đạo hàm f(x)=x^5 + ln(x) + cos(x)', a: '5x^4 + 1/x - sin(x)'},
  {q: 'Tính đạo hàm f(x)=2x^3 - 3x^2 + 4x - 5', a: '6x^2 - 6x + 4'},
  {q: 'Tính đạo hàm f(x)=3x^4 + 2x^3 - x^2 + 7', a: '12x^3 + 6x^2 - 2x'},
  {q: 'Tính đạo hàm f(x)=x^2 e^(2x)', a: '2x e^(2x) + 2x^2 e^(2x)'},
  {q: 'Tính đạo hàm f(x)=e^(x^2 + x)', a: '(2x + 1) e^(x^2 + x)'},
  {q: 'Tính đạo hàm f(x)=ln(x^2 + x + 1)', a: '(2x + 1)/(x^2 + x + 1)'},
  {q: 'Tính đạo hàm f(x)=sin(x^3 + x)', a: 'cos(x^3 + x) (3x^2 + 1)'},
  {q: 'Tính đạo hàm f(x)=cos(x^2 + 2x)', a: '-sin(x^2 + 2x) (2x + 2)'},
  {q: 'Tính đạo hàm f(x)=x^2 + 3x + 5', a: '2x + 3'},
  {q: 'Tính đạo hàm f(x)=x^3 - 4x + 7', a: '3x^2 - 4'},
  {q: 'Tính đạo hàm f(x)=e^x + ln(x) + sin(x)', a: 'e^x + 1/x + cos(x)'},
  {q: 'Tính đạo hàm f(x)=x^2 tan(x)', a: '2x tan(x) + x^2 sec^2(x)'},
  {q: 'Tính đạo hàm f(x)=x^3 cot(x)', a: '3x^2 cot(x) - x^3 csc^2(x)'},
  {q: 'Tính ∫ 2x dx', a: 'x^2 + C'},
  {q: 'Tính ∫ (3x^2 + 5) dx', a: 'x^3 + 5x + C'},
  {q: 'Tính ∫ 0 dx', a: 'C'},
  {q: 'Tính ∫ (10x^4 - 3x^2) dx', a: '2x^5 - x^3 + C'},
  {q: 'Tính ∫ cos(x) dx', a: 'sin(x) + C'},
  {q: 'Tính ∫ -sin(x) dx', a: '-cos(x) + C'},
  {q: 'Tính ∫ e^x dx', a: 'e^x + C'},
  {q: 'Tính ∫ 6e^(3x) dx', a: '2e^(3x) + C'},
  {q: 'Tính ∫ 1/x dx', a: 'ln|x| + C'},
  {q: 'Tính ∫ 18x dx', a: '9x^2 + C'},
  {q: 'Tính ∫ (20x^3 + 6x - 2) dx', a: '5x^4 + 3x^2 - 2x + C'},
  {q: 'Tính ∫ 7x^6 dx', a: 'x^7 + C'},
  {q: 'Tính ∫ (3x^2 + 4) dx', a: 'x^3 + 4x + C'},
  {q: 'Tính ∫ 2cos(2x) dx', a: 'sin(2x) + C'},
  {q: 'Tính ∫ -5sin(5x) dx', a: 'cos(5x) + C'},
  {q: 'Tính ∫ (2e^(2x) + 3) dx', a: 'e^(2x) + 3x + C'},
  {q: 'Tính ∫ 2/x dx', a: '2 ln|x| + C'},
  {q: 'Tính ∫ (2x + 1) dx', a: 'x^2 + x + C'},
  {q: 'Tính ∫ (5x^4 - 4x + 3) dx', a: 'x^5 - 2x^2 + 3x + C'},
  {q: 'Tính ∫ 21x^2 dx', a: '7x^3 + C'},
  {q: 'Tính ∫ (4x^3 - 3x^2 + 2x - 1) dx', a: 'x^4 - x^3 + x^2 - x + C'},
  {q: 'Tính ∫ (5cos(x) + 3sin(x)) dx', a: '5sin(x) - 3cos(x) + C'},
  {q: 'Tính ∫ (2/x + 2x) dx', a: '2ln|x| + x^2 + C'},
  {q: 'Tính ∫ 2xe^(x^2) dx', a: 'e^(x^2) + C'},
  {q: 'Tính ∫ 2x/(x^2 + 1) dx', a: 'ln|x^2 + 1| + C'},
  {q: 'Tính ∫ 2x cos(x^2) dx', a: 'sin(x^2) + C'},
  {q: 'Tính ∫ -2x sin(x^2) dx', a: '-cos(x^2) + C'},
  {q: 'Tính ∫ (9x^2 + 8x - 5) dx', a: '3x^3 + 4x^2 - 5x + C'},
  {q: 'Tính ∫ 1/(x ln2) dx', a: 'log_2|x| + C'},
  {q: 'Tính ∫ (2x sin(x) + x^2 cos(x)) dx', a: 'x^2 sin(x) + C'},
  {q: 'Tính ∫ (3x^2 cos(x) - x^3 sin(x)) dx', a: 'x^3 cos(x) + C'},
  {q: 'Tính ∫ (3e^(3x) sin(x) + e^(3x) cos(x)) dx', a: 'e^(3x) sin(x) + C'},
  {q: 'Tính ∫ (e^x ln(x) + e^x/x) dx', a: 'e^x ln(x) + C'},
  {q: 'Tính ∫ -1/x^2 dx', a: '1/x + C'},
  {q: 'Tính ∫ (4x^3 ln(x) + x^3) dx', a: 'x^4 ln(x) + C'},
  {q: 'Tính ∫ sec^2(x) dx', a: 'tan(x) + C'},
  {q: 'Tính ∫ (tan(x) + x sec^2(x)) dx', a: 'x tan(x) + C'},
  {q: 'Tính ∫ -csc^2(x) dx', a: '-cot(x) + C'},
  {q: 'Tính ∫ (cot(x) - x csc^2(x)) dx', a: 'x cot(x) + C'},
  {q: 'Tính ∫ 1/sqrt(1-x^2) dx', a: 'arcsin(x) + C'},
  {q: 'Tính ∫ -1/sqrt(1-x^2) dx', a: 'arccos(x) + C'},
  {q: 'Tính ∫ 1/(1+x^2) dx', a: 'arctan(x) + C'},
  {q: 'Tính ∫ (arctan(x) + x/(1+x^2)) dx', a: 'x arctan(x) + C'},
  {q: 'Tính ∫ (1 - ln(x))/x^2 dx', a: '-ln(x)/x + C'},
  {q: 'Tính ∫ (2x e^x + x^2 e^x) dx', a: 'x^2 e^x + C'},
  {q: 'Tính ∫ -2x e^(-x^2) dx', a: 'e^(-x^2) + C'},
  {q: 'Tính ∫ (3x^2 + cos(x) + 1/x) dx', a: 'x^3 + sin(x) + ln|x| + C'},
  {q: 'Tính ∫ (4x^3 + 15x^2 - 2) dx', a: 'x^4 + 5x^3 - 2x + C'},
  {q: 'Tính ∫ 1/(2sqrt(x)) dx', a: 'sqrt(x) + C'},
  {q: 'Tính ∫ 3/2 sqrt(x) dx', a: 'x^(3/2) + C'},
  {q: 'Tính ∫ (5/2)x^(3/2) dx', a: 'x^(5/2) + C'},
  {q: 'Tính ∫ (7/2)x^(5/2) dx', a: 'x^(7/2) + C'},
  {q: 'Tính ∫ (cos(x) - sin(x) + e^x) dx', a: 'sin(x) + cos(x) + e^x + C'},
  {q: 'Tính ∫ (4x + 3) dx', a: '2x^2 + 3x + C'},
  {q: 'Tính ∫ (5x^4 - 12x^2 + 1) dx', a: 'x^5 - 4x^3 + x + C'},
  {q: 'Tính ∫ 1/(x+1) dx', a: 'ln|x+1| + C'},
  {q: 'Tính ∫ e^(x+2) dx', a: 'e^(x+2) + C'},
  {q: 'Tính ∫ 3cos(3x) dx', a: 'sin(3x) + C'},
  {q: 'Tính ∫ -2sin(2x) dx', a: 'cos(2x) + C'},
  {q: 'Tính ∫ (3x^2 + 4x - 5) dx', a: 'x^3 + 2x^2 - 5x + C'},
  {q: 'Tính ∫ 5 dx', a: '5x + C'},
  {q: 'Tính ∫ (2x sin(x) + x^2 cos(x) - sin(x)) dx', a: '-cos(x) + x^2 sin(x) + C'},
  {q: 'Tính ∫ (3x^2 cos(x) - x^3 sin(x) - cos(x)) dx', a: '-sin(x) + x^3 cos(x) + C'},
  {q: 'Tính ∫ (e^x + x e^x) dx', a: 'x e^x + C'},
  {q: 'Tính ∫ (1 + ln(x)) dx', a: 'x ln(x) + C'},
  {q: 'Tính ∫ (2x ln(x) + x) dx', a: 'x^2 ln(x) + C'},
  {q: 'Tính ∫ 2/(1+4x^2) dx', a: 'arctan(2x) + C'},
  {q: 'Tính ∫ 2x/sqrt(1-x^4) dx', a: 'arcsin(x^2) + C'},
  {q: 'Tính ∫ -3/sqrt(1-9x^2) dx', a: 'arccos(3x) + C'},
  {q: 'Tính ∫ 2 sec^2(2x) dx', a: 'tan(2x) + C'},
  {q: 'Tính ∫ -3 csc^2(3x) dx', a: 'cot(3x) + C'},
  {q: 'Tính ∫ (4x^3 + e^x + cos(x)) dx', a: 'x^4 + e^x + sin(x) + C'},
  {q: 'Tính ∫ (5x^4 + 1/x - sin(x)) dx', a: 'x^5 + ln|x| + cos(x) + C'},
  {q: 'Tính ∫ (6x^2 - 6x + 4) dx', a: '2x^3 - 3x^2 + 4x + C'},
  {q: 'Tính ∫ (12x^3 + 6x^2 - 2x) dx', a: '3x^4 + 2x^3 - x^2 + C'},
  {q: 'Tính ∫ (2x e^(2x) + 2x^2 e^(2x)) dx', a: 'x^2 e^(2x) + C'},
  {q: 'Tính ∫ (2x + 1) e^(x^2 + x) dx', a: 'e^(x^2 + x) + C'},
  {q: 'Tính ∫ (2x + 1)/(x^2 + x + 1) dx', a: 'ln|x^2 + x + 1| + C'},
  {q: 'Tính ∫ (3x^2 + 1) cos(x^3 + x) dx', a: 'sin(x^3 + x) + C'},
  {q: 'Tính ∫ -(2x + 2) sin(x^2 + 2x) dx', a: 'cos(x^2 + 2x) + C'},
  {q: 'Tính ∫ (2x + 3) dx', a: 'x^2 + 3x + C'},
  {q: 'Tính ∫ (3x^2 - 4) dx', a: 'x^3 - 4x + C'},
  {q: 'Tính ∫ (e^x + 1/x + cos(x)) dx', a: 'e^x + ln|x| + sin(x) + C'},
  {q: 'Tính ∫ (2x tan(x) + x^2 sec^2(x)) dx', a: 'x^2 tan(x) + C'},
  {q: 'Tính ∫ (3x^2 cot(x) - x^3 csc^2(x)) dx', a: 'x^3 cot(x) + C'},
    {q: 'Tìm nguyên hàm F(x) sao cho F\'(x)=2x', a: 'x^2'},
  {q: 'Tìm nguyên hàm F(x) sao cho F\'(x)=3x^2', a: 'x^3'},
  {q: 'Tìm nguyên hàm F(x) sao cho F\'(x)=5x^4', a: 'x^5'},
  
  {q: 'Tìm nguyên hàm F(x) của f(x)=2x', a: 'x^2 + C'},
  {q: 'Tìm nguyên hàm F(x) của f(x)=3x^2 + 5', a: 'x^3 + 5x + C'},
  {q: 'Tìm nguyên hàm F(x) của f(x)=0', a: 'C'},
  {q: 'Tìm nguyên hàm F(x) của f(x)=10x^4 - 3x^2', a: '2x^5 - x^3 + C'},
  {q: 'Tìm nguyên hàm F(x) của f(x)=cos(x)', a: 'sin(x) + C'},
  {q: 'Tìm nguyên hàm F(x) của f(x)=-sin(x)', a: '-cos(x) + C'},
  {q: 'Tìm nguyên hàm F(x) của f(x)=e^x', a: 'e^x + C'},
  {q: 'Tìm nguyên hàm F(x) của f(x)=6e^(3x)', a: '2e^(3x) + C'},
  {q: 'Tìm nguyên hàm F(x) của f(x)=1/x', a: 'ln|x| + C'},
  {q: 'Tìm nguyên hàm F(x) của f(x)=18x', a: '9x^2 + C'},
  {q: 'Tìm nguyên hàm F(x) của f(x)=20x^3 + 6x - 2', a: '5x^4 + 3x^2 - 2x + C'},
  {q: 'Tìm nguyên hàm F(x) của f(x)=7x^6', a: 'x^7 + C'},
  {q: 'Tìm nguyên hàm F(x) của f(x)=3x^2 + 4', a: 'x^3 + 4x + C'},
  {q: 'Tìm nguyên hàm F(x) của f(x)=2cos(2x)', a: 'sin(2x) + C'},
  {q: 'Tìm nguyên hàm F(x) của f(x)=-5sin(5x)', a: 'cos(5x) + C'},
  {q: 'Tìm nguyên hàm F(x) của f(x)=2e^(2x) + 3', a: 'e^(2x) + 3x + C'},
  {q: 'Tìm nguyên hàm F(x) của f(x)=1/x', a: 'ln|x| + C'},
  {q: 'Tìm nguyên hàm F(x) của f(x)=2x + 1', a: 'x^2 + x + C'},
  {q: 'Tìm nguyên hàm F(x) của f(x)=5x^4 - 4x + 3', a: 'x^5 - 2x^2 + 3x + C'},
  {q: 'Tìm nguyên hàm F(x) của f(x)=21x^2', a: '7x^3 + C'},
  {q: 'Tìm nguyên hàm F(x) của f(x)=4x^3 - 3x^2 + 2x - 1', a: 'x^4 - x^3 + x^2 - x + C'},
  {q: 'Tìm nguyên hàm F(x) của f(x)=5cos(x) + 3sin(x)', a: '5sin(x) - 3cos(x) + C'},
  {q: 'Tìm nguyên hàm F(x) của f(x)=2/x + 2x', a: '2ln|x| + x^2 + C'},
  {q: 'Tìm nguyên hàm F(x) của f(x)=2xe^(x^2)', a: 'e^(x^2) + C'},
  {q: 'Tìm nguyên hàm F(x) của f(x)=2x/(x^2 + 1)', a: 'ln|x^2 + 1| + C'},
  {q: 'Tìm nguyên hàm F(x) của f(x)=2x cos(x^2)', a: 'sin(x^2) + C'},
  {q: 'Tìm nguyên hàm F(x) của f(x)=-2x sin(x^2)', a: '-cos(x^2) + C'},
  {q: 'Tìm nguyên hàm F(x) của f(x)=9x^2 + 8x - 5', a: '3x^3 + 4x^2 - 5x + C'},
  {q: 'Tìm nguyên hàm F(x) của f(x)=1/(x ln2)', a: 'log_2|x| + C'},
  {q: 'Tìm nguyên hàm F(x) của f(x)=2x sin(x) + x^2 cos(x)', a: '-x^2 cos(x) + C + x^2 sin(x)'}, 
  {q: 'Tìm nguyên hàm F(x) của f(x)=3x^2 cos(x) - x^3 sin(x)', a: 'x^3 cos(x) + C'},
  {q: 'Tìm nguyên hàm F(x) của f(x)=3e^(3x) sin(x) + e^(3x) cos(x)', a: 'e^(3x) sin(x) + C'},
  {q: 'Tìm nguyên hàm F(x) của f(x)=e^x ln(x) + e^x/x', a: 'e^x ln(x) + C'},
  {q: 'Tìm nguyên hàm F(x) của f(x)=-1/x^2', a: '1/x + C'},
  {q: 'Tìm nguyên hàm F(x) của f(x)=4x^3 ln(x) + x^3', a: 'x^4 ln(x) + C'},
  {q: 'Tìm nguyên hàm F(x) của f(x)=sec^2(x)', a: 'tan(x) + C'},
  {q: 'Tìm nguyên hàm F(x) của f(x)=tan(x) + x sec^2(x)', a: 'x tan(x) + C'},
  {q: 'Tìm nguyên hàm F(x) của f(x)=-csc^2(x)', a: '-cot(x) + C'},
  {q: 'Tìm nguyên hàm F(x) của f(x)=cot(x) - x csc^2(x)', a: 'x cot(x) + C'},
  {q: 'Tìm nguyên hàm F(x) của f(x)=1/sqrt(1-x^2)', a: 'arcsin(x) + C'},
  {q: 'Tìm nguyên hàm F(x) của f(x)=-1/sqrt(1-x^2)', a: 'arccos(x) + C'},
  {q: 'Tìm nguyên hàm F(x) của f(x)=1/(1+x^2)', a: 'arctan(x) + C'},
  {q: 'Tìm nguyên hàm F(x) của f(x)=arctan(x) + x/(1+x^2)', a: 'x arctan(x) + C'},
  {q: 'Tìm nguyên hàm F(x) của f(x)=(1 - ln(x))/x^2', a: '-ln(x)/x + C'},
  {q: 'Tìm nguyên hàm F(x) của f(x)=2x e^x + x^2 e^x', a: 'x^2 e^x + C'},
  {q: 'Tìm nguyên hàm F(x) của f(x)=-2x e^(-x^2)', a: 'e^(-x^2) + C'},
  {q: 'Tìm nguyên hàm F(x) của f(x)=3x^2 + cos(x) + 1/x', a: 'x^3 + sin(x) + ln|x| + C'},
  {q: 'Tìm nguyên hàm F(x) của f(x)=4x^3 + 15x^2 - 2', a: 'x^4 + 5x^3 - 2x + C'},
  {q: 'Tìm nguyên hàm F(x) của f(x)=1/(2sqrt(x))', a: 'sqrt(x) + C'},
  {q: 'Tìm nguyên hàm F(x) của f(x)=3/2 sqrt(x)', a: 'x^(3/2) + C'},
  {q: 'Tìm nguyên hàm F(x) của f(x)=(5/2)x^(3/2)', a: 'x^(5/2) + C'},
  {q: 'Tìm nguyên hàm F(x) của f(x)=(7/2)x^(5/2)', a: 'x^(7/2) + C'},
  {q: 'Tìm nguyên hàm F(x) của f(x)=cos(x) - sin(x) + e^x', a: 'sin(x) + cos(x) + e^x + C'},
  {q: 'Tìm nguyên hàm F(x) của f(x)=4x + 3', a: '2x^2 + 3x + C'},
  {q: 'Tìm nguyên hàm F(x) của f(x)=5x^4 - 12x^2 + 1', a: 'x^5 - 4x^3 + x + C'},
  {q: 'Tìm nguyên hàm F(x) của f(x)=1/(x+1)', a: 'ln|x+1| + C'},
  {q: 'Tìm nguyên hàm F(x) của f(x)=e^(x+2)', a: 'e^(x+2) + C'},
  {q: 'Tìm nguyên hàm F(x) của f(x)=3cos(3x)', a: 'sin(3x) + C'},
  {q: 'Tìm nguyên hàm F(x) của f(x)=-2sin(2x)', a: 'cos(2x) + C'},
  {q: 'Tìm nguyên hàm F(x) của f(x)=3x^2 + 4x - 5', a: 'x^3 + 2x^2 - 5x + C'},
  {q: 'Tìm nguyên hàm F(x) của f(x)=5', a: '5x + C'},
  {q: 'Tìm nguyên hàm F(x) của f(x)=2x sin(x) + x^2 cos(x) - sin(x)', a: '-cos(x) + x^2 sin(x) + C'},
  {q: 'Tìm nguyên hàm F(x) của f(x)=3x^2 cos(x) - x^3 sin(x) - cos(x)', a: '-sin(x) + x^3 cos(x) + C'},
  {q: 'Tìm nguyên hàm F(x) của f(x)=e^x + x e^x', a: 'x e^x + C'},
  {q: 'Tìm nguyên hàm F(x) của f(x)=1 + ln(x)', a: 'x ln(x) + C'},
  {q: 'Tìm nguyên hàm F(x) của f(x)=2x ln(x) + x', a: 'x^2 ln(x) + C'},
  {q: 'Tìm nguyên hàm F(x) của f(x)=2/(1+4x^2)', a: 'arctan(2x) + C'},
  {q: 'Tìm nguyên hàm F(x) của f(x)=2x/sqrt(1-x^4)', a: 'arcsin(x^2) + C'},
  {q: 'Tìm nguyên hàm F(x) của f(x)=-3/sqrt(1-9x^2)', a: 'arccos(3x) + C'},
  {q: 'Tìm nguyên hàm F(x) của f(x)=2 sec^2(2x)', a: 'tan(2x) + C'},
  {q: 'Tìm nguyên hàm F(x) của f(x)=-3 csc^2(3x)', a: 'cot(3x) + C'},
  {q: 'Tìm nguyên hàm F(x) của f(x)=4x^3 + e^x + cos(x)', a: 'x^4 + e^x + sin(x) + C'},
  {q: 'Tìm nguyên hàm F(x) của f(x)=5x^4 + 1/x - sin(x)', a: 'x^5 + ln|x| + cos(x) + C'},
  {q: 'Tìm nguyên hàm F(x) của f(x)=6x^2 - 6x + 4', a: '2x^3 - 3x^2 + 4x + C'},
  {q: 'Tìm nguyên hàm F(x) của f(x)=12x^3 + 6x^2 - 2x', a: '3x^4 + 2x^3 - x^2 + C'},
  {q: 'Tìm nguyên hàm F(x) của f(x)=2x e^(2x) + 2x^2 e^(2x)', a: 'x^2 e^(2x) + C'},
  {q: 'Tìm nguyên hàm F(x) của f(x)=(2x + 1) e^(x^2 + x)', a: 'e^(x^2 + x) + C'},
  {q: 'Tìm nguyên hàm F(x) của f(x)=(2x + 1)/(x^2 + x + 1)', a: 'ln|x^2 + x + 1| + C'},
  {q: 'Tìm nguyên hàm F(x) của f(x)=(3x^2 + 1) cos(x^3 + x)', a: 'sin(x^3 + x) + C'},
  {q: 'Tìm nguyên hàm F(x) của f(x)=-(2x + 2) sin(x^2 + 2x)', a: 'cos(x^2 + 2x) + C'},
  {q: 'Tìm nguyên hàm F(x) của f(x)=2x + 3', a: 'x^2 + 3x + C'},
  {q: 'Tìm nguyên hàm F(x) của f(x)=3x^2 - 4', a: 'x^3 - 4x + C'},
  {q: 'Tìm nguyên hàm F(x) của f(x)=e^x + 1/x + cos(x)', a: 'e^x + ln|x| + sin(x) + C'},
  {q: 'Tìm nguyên hàm F(x) của f(x)=2x tan(x) + x^2 sec^2(x)', a: 'x^2 tan(x) + C'},
  {q: 'Tìm nguyên hàm F(x) của f(x)=3x^2 cot(x) - x^3 csc^2(x)', a: 'x^3 cot(x) + C'},
  {q: 'Tam giác ABC vuông tại A, AB=3, AC=4. Tính BC?', a: '5'},
  {q: 'Tam giác ABC vuông tại B, BC=6, AB=8. Tính AC?', a: '10'},
  {q: 'Tam giác ABC vuông tại C, AC=5, BC=12. Tính AB?', a: '13'},
  {q: 'Tam giác ABC, AB=7, AC=24, BC=25. Tính góc A?', a: '16'},
  {q: 'Tam giác ABC, AB=10, AC=14, góc A=60, tính BC?', a: '10'},
  {q: 'Tam giác ABC, góc A=30, góc B=45, AB=10. Tính AC?', a: '14'},
  {q: 'Tam giác vuông ABC, góc B=30, BC=8. Tính AB?', a: '5'},
  {q: 'Tam giác ABC, AB=9, AC=12, BC=15. Tính góc C?', a: '90'},
  {q: 'Tam giác ABC, góc A=45, AC=7, BC=10. Tính góc B?', a: 'Không tồn tại'},
  {q: 'Tam giác vuông ABC, AB=6, BC=10. Tính góc B?', a: '37'},
  {q: 'Tam giác ABC, AB=8, AC=6, BC=10. Tính góc A?', a: '90'},
  {q: 'Tam giác ABC, góc A=60, góc B=50, AC=12. Tính BC?', a: '11'},
  {q: 'Tam giác ABC, AB=5, AC=7, góc B=40. Tính BC?', a: '6'},
  {q: 'Tam giác vuông ABC, góc A=30, AC=8. Tính AB?', a: '5'},
  {q: 'Tam giác ABC, AB=13, AC=14, BC=15. Tính góc B?', a: '60'},
  {q: 'Tam giác ABC, góc A=50, góc C=60, BC=10. Tính AB?', a: '8'},
  {q: 'Tam giác ABC, góc B=40, góc C=70, AC=12. Tính AB?', a: '9'},
  {q: 'Tam giác ABC, AB=7, BC=9, góc C=50. Tính AC?', a: '8'},
  {q: 'Tam giác vuông ABC, AB=9, AC=12. Tính BC?', a: '15'},
  {q: 'Tam giác ABC, góc A=45, góc B=45, AC=10. Tính BC?', a: '10'},
  {q: 'Tam giác ABC, góc A=30, góc B=60, AC=8. Tính BC?', a: '9'},
  {q: 'Tam giác ABC, AB=6, AC=10, BC=12. Tính góc A?', a: '28'},
  {q: 'Tam giác ABC, góc B=50, BC=14, AC=10. Tính góc C?', a: '37'},
  {q: 'Tam giác ABC, AB=9, AC=15, BC=12. Tính góc B?', a: '37'},
  {q: 'Tam giác ABC vuông tại A, AB=5, AC=12. Tính BC?', a: '13'},
  {q: 'Tam giác ABC, góc A=60, AC=10, góc B=50. Tính BC?', a: '8'},
  {q: 'Tam giác ABC, AB=8, AC=15, BC=17. Tính góc C?', a: '90'},
  {q: 'Tam giác ABC, góc A=45, góc C=60, AC=12. Tính góc B?', a: '75'},
  {q: 'Tam giác vuông ABC, góc B=30, AC=10. Tính AB?', a: '6'},
  {q: 'Tam giác ABC, AB=7, AC=24, BC=25. Tính góc B?', a: '74'},
  {q: 'Tam giác ABC, góc A=40, AC=9, góc B=70. Tính BC?', a: '10'},
  {q: 'Tam giác ABC, AB=5, AC=7, BC=8. Tính góc C?', a: '50'},
  {q: 'Tam giác vuông ABC, AB=8, AC=15. Tính BC?', a: '17'},
  {q: 'Tam giác ABC, góc A=60, góc B=50, AC=12. Tính góc C?', a: '70'},
  {q: 'Tam giác ABC, AB=9, AC=12, BC=15. Tính góc A?', a: '37'},
  {q: 'Tam giác ABC, góc B=45, góc C=60, AC=10. Tính góc A?', a: '75'},
  {q: 'Tam giác ABC, AB=6, AC=8, BC=10. Tính góc B?', a: '37'},
  {q: 'Tam giác vuông ABC, góc A=30, AB=6. Tính BC?', a: '12'},
  {q: 'Tam giác ABC, góc A=50, AC=10, góc B=60. Tính BC?', a: '11'},
  {q: 'Tam giác ABC, AB=7, AC=24, BC=25. Tính góc C?', a: '90'},
  {q: 'Tam giác ABC, góc A=30, AC=9, góc C=60. Tính góc B?', a: '90'},
  {q: 'Tam giác ABC, AB=8, AC=15, BC=17. Tính góc A?', a: '28'},
  {q: 'Tam giác vuông ABC, góc B=30, BC=10. Tính AC?', a: '9'},
  {q: 'Tam giác ABC, góc A=45, góc B=45, AC=12. Tính AB?', a: '12'},
  {q: 'Tam giác ABC, AB=9, AC=12, BC=15. Tính góc B?', a: '37'},
  {q: 'Tam giác ABC, góc A=60, góc C=50, AC=10. Tính góc B?', a: '70'},
  {q: 'Tam giác vuông ABC, AB=6, AC=8. Tính BC?', a: '10'},
  {q: 'Tam giác ABC, AB=5, AC=7, góc A=40. Tính BC?', a: '6'},
  {q: 'Tam giác ABC, góc B=45, góc C=60, AC=12. Tính góc A?', a: '75'},
  {q: 'Tam giác ABC, AB=8, AC=15, BC=17. Tính góc C?', a: '90'},
  {q: 'Tam giác ABC, góc A=50, góc B=60, AC=10. Tính BC?', a: '11'},
  {q: 'Tam giác vuông ABC, góc A=30, AB=5. Tính AC?', a: '9'},
  {q: 'Tam giác ABC, AB=6, AC=10, BC=12. Tính góc B?', a: '37'},
  {q: 'Tam giác ABC, góc A=40, góc C=60, BC=10. Tính góc B?', a: '80'},
  {q: 'Tam giác ABC, AB=9, AC=15, BC=12. Tính góc C?', a: '53'},
  {q: 'Tam giác vuông ABC, AB=7, AC=24. Tính BC?', a: '25'},
  {q: 'Tam giác ABC, góc A=60, góc B=50, AC=12. Tính góc C?', a: '70'},
  {q: 'Tam giác ABC, AB=8, AC=15, BC=17. Tính góc B?', a: '28'},
  {q: 'Tam giác ABC, góc A=45, góc B=45, AC=10. Tính góc C?', a: '90'},
  {q: 'Tam giác vuông ABC, góc B=30, BC=8. Tính AC?', a: '7'},
  {q: 'Tam giác ABC, AB=7, AC=24, BC=25. Tính góc A?', a: '16'},
  {q: 'Tam giác ABC, góc A=30, góc B=45, AB=10. Tính góc C?', a: '105'},
  {q: 'Tam giác ABC, AB=9, AC=12, BC=15. Tính góc A?', a: '37'},
  {q: 'Tam giác ABC, góc B=45, góc C=60, AC=10. Tính góc A?', a: '75'},
  {q: 'Tam giác vuông ABC, góc A=30, AC=8. Tính BC?', a: '9'},
  {q: 'Tam giác ABC, AB=5, AC=7, BC=8. Tính góc B?', a: '50'},
  {q: 'Tam giác ABC, góc A=60, góc B=50, AC=12. Tính góc C?', a: '70'},
  {q: 'Tam giác ABC, AB=6, AC=8, BC=10. Tính góc C?', a: '90'},
  {q: 'Tam giác ABC, góc A=45, góc C=60, AC=12. Tính góc B?', a: '75'},
  {q: 'Tam giác vuông ABC, AB=6, AC=8. Tính góc B?', a: '37'},
  {q: 'Tam giác ABC, AB=7, AC=24, BC=25. Tính góc B?', a: '74'},
  {q: 'Tam giác ABC, góc A=30, AC=9, góc C=60. Tính góc B?', a: '90'},
  {q: 'Tam giác ABC, AB=8, AC=15, BC=17. Tính góc A?', a: '28'},
  {q: 'Tam giác vuông ABC, góc B=30, BC=10. Tính AB?', a: '5'},
  {q: 'Tam giác ABC, góc A=45, góc B=45, AC=12. Tính góc C?', a: '90'},
  {q: 'Tam giác ABC, AB=9, AC=12, BC=15. Tính góc B?', a: '37'},
  {q: 'Tam giác ABC, góc A=60, góc C=50, AC=10. Tính góc B?', a: '70'},
  {q: 'Tam giác vuông ABC, AB=6, AC=8. Tính BC?', a: '10'},
  {q: 'Tam giác ABC, AB=5, AC=7, góc A=40. Tính góc C?', a: '100'},
  {q: 'Tam giác ABC, góc B=45, góc C=60, AC=12. Tính góc A?', a: '75'},
  {q: 'Tam giác ABC, AB=8, AC=15, BC=17. Tính góc C?', a: '90'},
  {q: 'Tam giác ABC, góc A=50, góc B=60, AC=10. Tính góc C?', a: '70'},
  {q: 'Tam giác vuông ABC, góc A=30, AB=5. Tính BC?', a: '9'},
  {q: 'Tam giác ABC, AB=6, AC=10, BC=12. Tính góc B?', a: '37'},
  {q: 'Tam giác ABC, góc A=40, góc C=60, BC=10. Tính góc B?', a: '80'},
  {q: 'Tam giác ABC, AB=9, AC=15, BC=12. Tính góc C?', a: '53'},
  {q: 'Tam giác vuông ABC, AB=7, AC=24. Tính BC?', a: '25'},
  {q: 'Tam giác ABC, góc A=60, góc B=50, AC=12. Tính góc C?', a: '70'},
  {q: 'Tam giác ABC, AB=8, AC=15, BC=17. Tính góc B?', a: '28'},
  {q: 'Tam giác ABC, góc A=45, góc B=45, AC=10. Tính góc C?', a: '90'},
   { q:'Giải PT: x^2 - 5x + 6 = 0. Tính x1 - x2 + 3?', a:'2' },
  { q:'Giải PT: x^2 - 7x + 10 = 0. Tính 2x1 - 3x2 + 5?', a:'-1' },
  { q:'Giải PT: x^2 - 3x - 10 = 0. Tính x1 + 2x2 - 4?', a:'7' },
  { q:'Giải PT: x^2 - 8x + 12 = 0. Tính 3x1 - x2 + 1?', a:'13' },
  { q:'Giải PT: x^2 - 6x + 5 = 0. Tính 4x1 - 2x2 + 7?', a:'13' },
  { q:'Giải PT: x^2 - 9x + 14 = 0. Tính x1*x2 + x1 - x2?', a:'10' },
  { q:'Giải PT: x^2 - 11x + 28 = 0. Tính 5x1 - x2?', a:'4' },
  { q:'Giải PT: x^2 - 15x + 54 = 0. Tính x1 + x2 - 10?', a:'5' },
  { q:'Giải PT: x^2 - 4x - 21 = 0. Tính x1*x2 + 3x1?', a:'-18' },
  { q:'Giải PT: x^2 - 10x + 21 = 0. Tính 2x1 - x2 + 6?', a:'8' },

  // 11–20 BẬC 3
  { q:'Giải PT: x^3 - 6x^2 + 11x - 6 = 0. Tính x1 + x2 - x3?', a:'0' },
  { q:'Giải PT: x^3 - 3x^2 - 4x + 12 = 0. Tính 2x1 - x2 + 3x3?', a:'6' },
  { q:'Giải PT: x^3 - 4x^2 - 1x + 4 = 0. Tính x1 + 2x2 + x3?', a:'7' },
  { q:'Giải PT: x^3 - 7x^2 + 14x - 8 = 0. Tính x1*x2 + x3?', a:'6' },
  { q:'Giải PT: x^3 - 9x^2 + 26x - 24 = 0. Tính 3x1 - x2 + x3?', a:'12' },
  { q:'Giải PT: x^3 - x^2 - 6x + 6 = 0. Tính x1 + x2 + x3?', a:'1' },
  { q:'Giải PT: x^3 - 10x^2 + 31x - 30 = 0. Tính x3 - x1?', a:'2' },
  { q:'Giải PT: x^3 - 3x^2 - 22x + 24 = 0. Tính x1 + 2x2?', a:'11' },
  { q:'Giải PT: x^3 - 15x^2 + 56x - 60 = 0. Tính x2 + x3 - x1?', a:'11' },
  { q:'Giải PT: x^3 - 4x^2 - 7x + 10 = 0. Tính x1x2 + x3?', a:'13' },

  // 21–30 BẬC 2 nâng cao
  { q:'Giải PT: x^2 - 13x + 36 = 0. Tính 5x1 - 3x2 + 2?', a:'-2' },
  { q:'Giải PT: x^2 - 12x + 20 = 0. Tính x1*x2 + x1 + 7?', a:'31' },
  { q:'Giải PT: x^2 - 17x + 72 = 0. Tính x2 - 2x1 + 11?', a:'18' },
  { q:'Giải PT: x^2 - 14x + 33 = 0. Tính x1 + x2 + x1x2?', a:'50' },
  { q:'Giải PT: x^2 - 16x + 39 = 0. Tính 4x1 - x2?', a:'25' },
  { q:'Giải PT: x^2 - 18x + 80 = 0. Tính 3x1 - 2x2?', a:'-2' },
  { q:'Giải PT: x^2 - 19x + 88 = 0. Tính x1 + 3x2?', a:'55' },
  { q:'Giải PT: x^2 - 20x + 84 = 0. Tính x2 - x1 + 5?', a:'6' },
  { q:'Giải PT: x^2 - 22x + 121 = 0. Tính 2x1 - x2 + 1?', a:'1' },
  { q:'Giải PT: x^2 - 25x + 144 = 0. Tính x1x2 + x1?', a:'180' },

  // 31–40 BẬC 3 nâng cao
  { q:'Giải PT: x^3 - 12x^2 + 47x - 60 = 0. Tính x1 + x3 - 2x2?', a:'0' },
  { q:'Giải PT: x^3 - 14x^2 + 49x - 50 = 0. Tính x1x2 + x3?', a:'18' },
  { q:'Giải PT: x^3 - 16x^2 + 63x - 70 = 0. Tính x1 + x2 + x3?', a:'16' },
  { q:'Giải PT: x^3 - 18x^2 + 83x - 100 = 0. Tính x3 - x2 + x1?', a:'0' },
  { q:'Giải PT: x^3 - 20x^2 + 99x - 126 = 0. Tính x1 + x2 - x3?', a:'-4' },
  { q:'Giải PT: x^3 - 21x^2 + 116x - 140 = 0. Tính x1 + x2?', a:'9' },
  { q:'Giải PT: x^3 - 11x^2 + 30x - 25 = 0. Tính x3 - x1 + x2?', a:'7' },
  { q:'Giải PT: x^3 - 24x^2 + 191x - 420 = 0. Tính x1 + x2 + x3?', a:'24' },
  { q:'Giải PT: x^3 - 26x^2 + 231x - 630 = 0. Tính x1*x2 + x3?', a:'140' },
  { q:'Giải PT: x^3 - 30x^2 + 323x - 840 = 0. Tính x1 - x2 + x3?', a:'10' },

  // 41–60 BẬC 2 mở rộng
  { q:'Giải PT: x^2 - 4x + 4 = 0. Tính 3x1 - 5?', a:'7' },
  { q:'Giải PT: x^2 - 6x + 9 = 0. Tính x1/2 + 3?', a:'4.5' },
  { q:'Giải PT: x^2 - 2x - 8 = 0. Tính x2 - x1?', a:'6' },
  { q:'Giải PT: x^2 - 10x + 16 = 0. Tính 2x1 + x2?', a:'12' },
  { q:'Giải PT: x^2 - 12x + 36 = 0. Tính x1^2?', a:'36' },
  { q:'Giải PT: x^2 - 7x + 12 = 0. Tính x1 + x2 + 1?', a:'8' },
  { q:'Giải PT: x^2 - x - 6 = 0. Tính x1*x2 - 3?', a:'-9' },
  { q:'Giải PT: x^2 - 8x + 15 = 0. Tính x1x1 + x2?', a:'12' },
  { q:'Giải PT: x^2 - 5x + 4 = 0. Tính x2/x1?', a:'4' },
  { q:'Giải PT: x^2 - 3x + 2 = 0. Tính 2x2 - 3x1?', a:'0' },
  { q:'Giải PT: x^2 - 9x + 20 = 0. Tính x1 + 2x2?', a:'13' },
  { q:'Giải PT: x^2 - 11x + 30 = 0. Tính x2 - 2x1?', a:'4' },
  { q:'Giải PT: x^2 - 14x + 40 = 0. Tính x1*x2 + x1?', a:'60' },
  { q:'Giải PT: x^2 - 15x + 44 = 0. Tính x1 + x2?', a:'15' },
  { q:'Giải PT: x^2 - 10x + 24 = 0. Tính x1^2 - x2?', a:'2' },
  { q:'Giải PT: x^2 - 22x + 85 = 0. Tính x1 + x2 + 3?', a:'25' },
  { q:'Giải PT: x^2 - 18x + 72 = 0. Tính x2 - x1 + 10?', a:'13' },
  { q:'Giải PT: x^2 - 8x + 7 = 0. Tính x1*x2?', a:'7' },
  { q:'Giải PT: x^2 - 6x + 8 = 0. Tính x1 + x2?', a:'6' },
  { q:'Giải PT: x^2 - 17x + 70 = 0. Tính x2 - x1?', a:'5' },

  // 61–80 BẬC 3 mở rộng
  { q:'Giải PT: x^3 - 6x^2 + 5x + 12 = 0. Tính x1 + x2 + x3?', a:'6' },
  { q:'Giải PT: x^3 - 9x^2 + 26x - 24 = 0. Tính x1*x2 + x3?', a:'10' },
  { q:'Giải PT: x^3 - 12x^2 + 39x - 28 = 0. Tính x1 + x3?', a:'10' },
  { q:'Giải PT: x^3 - 15x^2 + 62x - 80 = 0. Tính x1*x3?', a:'40' },
  { q:'Giải PT: x^3 - 18x^2 + 89x - 120 = 0. Tính x1 + x2?', a:'9' },
  { q:'Giải PT: x^3 - 21x^2 + 116x - 160 = 0. Tính x1 + x3?', a:'18' },
  { q:'Giải PT: x^3 - 24x^2 + 155x - 294 = 0. Tính x2?', a:'7' },
  { q:'Giải PT: x^3 - 27x^2 + 198x - 405 = 0. Tính x1 + x2 + x3?', a:'27' },
  { q:'Giải PT: x^3 - 30x^2 + 245x - 450 = 0. Tính x3?', a:'15' },
  { q:'Giải PT: x^3 - 33x^2 + 308x - 616 = 0. Tính x1 + x2?', a:'22' },
  { q:'Giải PT: x^3 - 36x^2 + 377x - 900 = 0. Tính x3?', a:'20' },
  { q:'Giải PT: x^3 - 39x^2 + 452x - 1120 = 0. Tính x1?', a:'7' },
  { q:'Giải PT: x^3 - 42x^2 + 533x - 1330 = 0. Tính x3?', a:'35' },
  { q:'Giải PT: x^3 - 45x^2 + 620x - 1575 = 0. Tính x2?', a:'25' },
  { q:'Giải PT: x^3 - 48x^2 + 713x - 1848 = 0. Tính x1 + x2 + x3?', a:'48' },
  { q:'Giải PT: x^3 - 51x^2 + 812x - 2145 = 0. Tính x3?', a:'45' },
  { q:'Giải PT: x^3 - 54x^2 + 917x - 2470 = 0. Tính x2 - x1?', a:'9' },
  { q:'Giải PT: x^3 - 57x^2 + 1028x - 2827 = 0. Tính x3?', a:'53' },
  { q:'Giải PT: x^3 - 60x^2 + 1145x - 3210 = 0. Tính x1 + x2?', a:'40' },
  { q:'Giải PT: x^3 - 63x^2 + 1268x - 3627 = 0. Tính x3?', a:'57' },

  // 81–100 BẬC 2 & 3 tổng hợp
  { q:'Giải PT: x^2 - 30x + 225 = 0. Tính x1?', a:'15' },
  { q:'Giải PT: x^2 - 2x + 1 = 0. Tính x1*5 + 3?', a:'8' },
  { q:'Giải PT: x^2 - 12x + 35 = 0. Tính x1 + 3x2?', a:'29' },
  { q:'Giải PT: x^2 - 29x + 210 = 0. Tính x2 - x1?', a:'7' },
  { q:'Giải PT: x^2 - 4x - 5 = 0. Tính x1 + x2 + 1?', a:'5' },
  { q:'Giải PT: x^3 - 10x^2 + 29x - 20 = 0. Tính x3?', a:'4' },
  { q:'Giải PT: x^3 - 8x^2 + 17x - 10 = 0. Tính x1*x2?', a:'5' },
  { q:'Giải PT: x^3 - 6x^2 + 13x - 12 = 0. Tính x2 + x3?', a:'7' },
  { q:'Giải PT: x^3 - 4x^2 + 3x = 0. Tính x1 + x2 + x3?', a:'4' },
  { q:'Giải PT: x^3 - 3x^2 - 4x + 12 = 0. Tính x3 - x1?', a:'5' },
  { q:'Giải PT: x^2 - 3x + 1 = 0. Tính x1 + x2?', a:'3' },
  { q:'Giải PT: x^2 - 5x + 4 = 0. Tính x2 - 2x1?', a:'-3' },
  { q:'Giải PT: x^2 - 7x + 12 = 0. Tính x1 + 5x2?', a:'37' },
  { q:'Giải PT: x^2 - 11x + 18 = 0. Tính x2/x1?', a:'3' },
  { q: 'Giải PT: x^2 - 17x + 72 = 0. Tính x1 + x2?', a: '17' },
  { q:'Giải PT: x^2 - 10x + 21 = 0. Tính x1*x2 + 2?', a:'23' },
  { q:'Giải PT: x^3 - 7x^2 + 10x = 0. Tính x1 + x2 + x3?', a:'7' },
  { q:'Giải PT: x^3 - 5x^2 + 8x - 4 = 0. Tính x1 + x2?', a:'4' },
  { q:'Giải PT: x^3 - 9x^2 + 20x - 12 = 0. Tính x3?', a:'3' },
  { q:'Giải PT: x^3 - 12x^2 + 32x - 24 = 0. Tính x1x3?', a:'12' },
  // ============================
  // 1–30: BẬC 1 (không cần làm tròn)
  // ============================
  { q: 'Một siêu thị bán bánh với giá 15.000đ/cái. Tính tiền khi mua 6 cái.', a: '90000' },
  { q: 'Tiền vé gửi xe đạp: 3.000đ/giờ. Gửi 5 giờ hết bao nhiêu tiền?', a: '15000' },
  { q: 'Một cửa hàng bán nước cam 20.000đ/ly. Mua 8 ly hết bao nhiêu?', a: '160000' },
  { q: 'Một người thợ sửa máy lấy 120.000đ/giờ. Làm 2 giờ phải trả bao nhiêu?', a: '240000' },
  { q: 'Tiệm photocopy tính 2.000đ/trang màu. In 25 trang hết bao nhiêu?', a: '50000' },
  { q: 'Một lớp học mua 40 bút, mỗi bút 5.000đ. Tổng tiền là bao nhiêu?', a: '200000' },
  { q: 'Dịch vụ thuê xe đạp: 10.000đ/giờ. Thuê 4 giờ hết bao nhiêu?', a: '40000' },
  { q: 'Một trang phục game giá 60 kim cương. Mua 7 trang phục cần bao nhiêu kim cương?', a: '420' },
  { q: 'Một quán trà chanh bán trà 12.000đ/cốc. Mua 10 cốc hết bao nhiêu?', a: '120000' },
  { q: 'Vé vào hồ bơi 30.000đ/người. Một nhóm 9 người trả bao nhiêu?', a: '270000' },

  { q: 'Taxi tính 11.000đ/km. Đi 9km hết bao nhiêu?', a: '99000' },
  { q: 'Một tiệm bánh bán bánh kem nhỏ 35.000đ/cái. Mua 3 cái hết bao nhiêu?', a: '105000' },
  { q: 'Một đội bóng mua 15 chai nước, mỗi chai 8.000đ. Tổng tiền là?', a: '120000' },
  { q: 'Tiệm Internet tính 6.000đ/giờ. Chơi 7 giờ hết bao nhiêu?', a: '42000' },
  { q: 'Một cửa hàng bán thước 4.000đ/cây. Mua 20 cây hết bao nhiêu?', a: '80000' },
  { q: 'Một họa sĩ bán tranh 150.000đ/bức. Bán 5 bức thu được bao nhiêu?', a: '750000' },
  { q: 'Gửi xe máy: 8.000đ/giờ. Gửi 3 giờ tốn bao nhiêu?', a: '24000' },
  { q: 'Một cửa hàng bán tai nghe 90.000đ/chiếc. Mua 6 chiếc hết bao nhiêu?', a: '540000' },
  { q: 'Một lớp học gọi 12 ly trà sữa, mỗi ly 25.000đ. Tổng chi phí?', a: '300000' },
  { q: 'Tiệm game bán vật phẩm 45 vàng/đơn vị. Mua 30 đơn vị hết bao nhiêu vàng?', a: '1350' },

  { q: 'Dịch vụ thuê laptop: 50.000đ/giờ. Thuê 4 giờ tốn bao nhiêu?', a: '200000' },
  { q: 'Một shop bán sticker 3.000đ/miếng. Mua 40 miếng hết bao nhiêu?', a: '120000' },
  { q: 'Một quán cà phê bán kem 10.000đ/viên. Mua 18 viên hết?', a: '180000' },
  { q: 'Một tiệm ảnh in hình 7.000đ/tấm. In 22 tấm hết bao nhiêu?', a: '154000' },
  { q: 'Thuê sân bóng mini: 300.000đ/giờ. Thuê 2 giờ hết bao nhiêu?', a: '600000' },
  { q: 'Một cửa hàng bán ô dù 70.000đ/cái. Mua 9 cái hết bao nhiêu?', a: '630000' },
  { q: 'Dịch vụ rửa xe 25.000đ/lần. Rửa 5 lần hết bao nhiêu?', a: '125000' },
  { q: 'Một cửa hàng bán kẹp tóc 2.500đ/cái. Mua 36 cái hết bao nhiêu?', a: '90000' },
  { q: 'Trà đào giá 18.000đ/cốc. Mua 11 cốc hết bao nhiêu?', a: '198000' },
  { q: 'Một trang web bán ảnh 40.000đ/tấm. Mua 4 tấm hết bao nhiêu?', a: '160000' },

  // ============================
  // 31–80: BẬC 2 (thêm yêu cầu làm tròn)
  // ============================
  { q: 'Một vật đang đứng yên được kéo với gia tốc 2m/s² trong 6 giây. Tính vận tốc đạt được.', a: '12' },
  { q: 'Một xe đạp chạy 5m/s và tăng tốc đều 1m/s² trong 4 giây. Tính quãng đường thêm được.', a: '26' },
  { q: 'Một bóng đèn được ném lên với vận tốc 8m/s. Tính độ cao sau 1.5 giây (làm tròn 2 chữ số thập phân, g=9.8).', a: '0.45' },
  { q: 'Một viên bi rơi từ độ cao 40m. Tính độ cao sau 2 giây (làm tròn 2 chữ số thập phân, g=9.8).', a: '0.80' },
  { q: 'Một đoàn tàu chạy với vận tốc 25m/s, tăng tốc 2m/s² trong 3 giây. Tính quãng đường đi.', a: '93' },
  { q: 'Một quả bóng được thả từ 60m, mỗi lần nảy 55%. Tính độ cao sau 3 lần nảy (làm tròn 2 chữ số).', a: '9.98' },
  { q: 'Một xe máy chạy 12m/s, tăng tốc 3m/s² trong 5 giây. Tính vận tốc cuối.', a: '27' },
  { q: 'Một ô tô đi 15m/s rồi giảm tốc đều 2m/s² trong 4 giây. Tính vận tốc còn lại.', a: '7' },
  { q: 'Một tên lửa mô hình bay lên 20m/s rồi tăng tốc đều 4m/s² trong 3 giây. Tính độ cao tăng thêm.', a: '102' },
  { q: 'Một vật rơi tự do 3 giây. Tính vận tốc đạt được (làm tròn 1 chữ số, g=9.8).', a: '29.4' },

  { q: 'Một xe đạp chạy 10m/s rồi tăng đều lên 20m/s trong 4 giây. Tính gia tốc.', a: '2.5' },
  { q: 'Một vật rơi từ 90m trong 2 giây. Tính độ cao còn lại (làm tròn 2 chữ số).', a: '50.80' },
  { q: 'Một tàu điện đang đi 18m/s, tăng tốc 1m/s² trong 10 giây. Tính quãng đường đi.', a: '280' },
  { q: 'Một tên lửa tăng tốc từ 0 lên 40m/s trong 5 giây. Tính gia tốc.', a: '8' },
  { q: 'Một xe chạy 20m/s trong 4 giây rồi dừng hẳn với giảm tốc 5m/s². Tính tổng thời gian.', a: '8' },
  { q: 'Một vật rơi tự do 6 giây. Tính quãng đường rơi.', a: '176.4' },
  { q: 'Một cầu thủ sút bóng lên 18m/s. Tính độ cao cao nhất (làm tròn 1 chữ số).', a: '16.5' },
  { q: 'Một quả bóng rơi từ 70m, nảy 60%. Tính độ cao sau 2 lần (làm tròn 1 chữ số).', a: '25.2' },
  { q: 'Một xe đi 30m/s rồi thắng với giảm tốc 3m/s². Tính thời gian dừng.', a: '10' },
  { q: 'Một viên đá được ném xuống 5m/s từ 50m. Tính thời gian chạm đất (làm tròn 2 chữ số).', a: '2.73' },

  { q: 'Một máy bay tăng tốc 4m/s² trong 11 giây từ vận tốc 0. Tính quãng đường.', a: '242' },
  { q: 'Một vật trượt với vận tốc 7m/s, giảm tốc 1m/s². Tính quãng đường đến khi dừng.', a: '24.5' },
  { q: 'Một xe đạp tăng vận tốc từ 2m/s lên 14m/s trong 6 giây. Tính gia tốc.', a: '2' },
  { q: 'Một quả bóng ném lên 14m/s. Tính vận tốc sau 2 giây (làm tròn 1 chữ số).', a: '-5.6' },
  { q: 'Một xe tăng tốc 1.5m/s² trong 8 giây từ trạng thái nghỉ. Tính vận tốc cuối.', a: '12' },
  { q: 'Một tảng đá rơi tự do từ 120m. Tính thời gian rơi (làm tròn 2 chữ số).', a: '4.94' },
    { q: 'Một quả bóng rơi 2 giây. Tính quãng đường rơi được (g=9.8).', a: '19.6' },
  { q: 'Một tảng đá rơi từ độ cao 25m trong 1.8 giây. Tính độ cao còn lại (làm tròn 2 chữ số).', a: '9.12' },
  { q: 'Một quả bóng rơi tự do 4 giây. Tính vận tốc chạm đất (làm tròn 1 chữ số).', a: '39.2' },
  { q: 'Một vật được ném thẳng lên 20m/s. Tính độ cao sau 2.2 giây (làm tròn 2 chữ số, g=9.8).', a: '3.96' },
  { q: 'Một giọt nước rơi từ 15m. Tính thời gian chạm đất (làm tròn 2 chữ số).', a: '1.75' },
  { q: 'Một quả bóng nảy 48% độ cao cũ. Thả từ 50m, tính độ cao sau 3 lần nảy (làm tròn 2 chữ số).', a: '5.52' },
  { q: 'Một vật rơi tự do 2.8 giây. Tính quãng đường rơi (làm tròn 1 chữ số).', a: '38.4' },
  { q: 'Một vật được ném lên 10m/s. Tính thời gian bắt đầu rơi xuống (làm tròn 2 chữ số).', a: '1.02' },
  { q: 'Một tảng đá rơi 3.5 giây. Tính vận tốc đạt được (làm tròn 2 chữ số).', a: '34.30' },
  { q: 'Một vật rơi từ 70m, tính thời gian chạm đất (làm tròn 2 chữ số).', a: '3.78' },

  { q: 'Một quả bóng nảy lại 65% độ cao cũ. Thả từ 20m, tính độ cao sau 4 lần nảy (làm tròn 2 chữ số).', a: '3.56' },
  { q: 'Một vật rơi 5 giây. Tính vận tốc đạt được (làm tròn 1 chữ số).', a: '49.0' },
  { q: 'Một quả bóng ném thẳng lên 22m/s. Tính độ cao sau 1.2 giây (làm tròn 2 chữ số).', a: '17.37' },
  { q: 'Một vật được thả rơi 3 giây. Tính quãng đường rơi (làm tròn 1 chữ số).', a: '44.1' },
  { q: 'Một vật rơi từ độ cao 30m. Tính vận tốc lúc chạm đất (làm tròn 2 chữ số).', a: '24.26' },
  { q: 'Một quả bóng nảy lại 70% độ cao ban đầu. Thả từ 10m, tính độ cao sau 5 lần nảy (làm tròn 2 chữ số).', a: '1.68' },
  { q: 'Một vật được ném lên 17m/s. Tính thời gian rơi ngược về vị trí ném (làm tròn 2 chữ số).', a: '3.47' },
  { q: 'Một viên bi rơi 1.6 giây. Tính vận tốc đạt được (làm tròn 2 chữ số).', a: '15.68' },
  { q: 'Một vật rơi từ 100m. Tính thời gian rơi (làm tròn 2 chữ số).', a: '4.52' },
  { q: 'Một quả bóng nảy lại 52% độ cao cũ. Thả từ 80m, tính độ cao sau 3 lần nảy (làm tròn 2 chữ số).', a: '11.18' },

  { q: 'Một vật được ném lên 12m/s. Tính độ cao cực đại (làm tròn 2 chữ số).', a: '7.35' },
  { q: 'Một vật rơi tự do từ 10m. Tính vận tốc sau 1.1 giây (làm tròn 2 chữ số).', a: '10.78' },
  { q: 'Một quả bóng rơi từ 20m. Tính thời gian rơi 12m đầu tiên (làm tròn 2 chữ số).', a: '1.56' },
  { q: 'Một vật rơi tự do 7 giây. Tính quãng đường (làm tròn 1 chữ số).', a: '240.1' },
  { q: 'Một quả bóng ném lên 15m/s. Tính vận tốc sau 1.4 giây (làm tròn 2 chữ số).', a: '1.28' },
  { q: 'Một tảng đá rơi từ 200m. Tính thời gian rơi (làm tròn 2 chữ số).', a: '6.39' },
  { q: 'Một vật rơi 4.5 giây. Tính vận tốc đạt được (làm tròn 1 chữ số).', a: '44.1' },
  { q: 'Một quả bóng nảy lại 40% độ cao cũ. Thả từ 100m, tính độ cao sau 3 lần nảy (làm tròn 2 chữ số).', a: '6.40' },
  { q: 'Một viên bi rơi từ 12m. Tính thời gian chạm đất (làm tròn 2 chữ số).', a: '1.56' },
  { q: 'Một quả bóng rơi 2.2 giây. Tính vận tốc lúc đó (làm tròn 2 chữ số).', a: '21.56' },

  { q: 'Một vật được ném thẳng lên 30m/s. Tính thời gian đạt đỉnh (làm tròn 2 chữ số).', a: '3.06' },
  { q: 'Một vật rơi từ 55m. Tính vận tốc lúc chạm đất (làm tròn 2 chữ số).', a: '32.84' },
  { q: 'Một quả bóng nảy lại 78% độ cao cũ. Thả từ 25m, tính độ cao sau 4 lần nảy (làm tròn 2 chữ số).', a: '7.34' },
  { q: 'Một khối gỗ rơi 3.3 giây. Tính quãng đường rơi (làm tròn 2 chữ số).', a: '53.37' },
  { q: 'Một vật rơi 6.2 giây. Tính vận tốc đạt được (làm tròn 2 chữ số).', a: '60.76' },
  { q: 'Một vật chuyển động với vận tốc ban đầu 12m/s, gia tốc 3m/s² trong 10 giây rồi giảm tốc 4m/s² cho đến khi dừng. Tính tổng quãng đường (làm tròn 2 chữ số).', a: '219.50' },
{ q: 'Một tên lửa mô hình tăng tốc 6m/s² trong 5 giây, sau đó bay đều 4 giây rồi rơi tự do (g=9.8). Tính độ cao cực đại (làm tròn 1 chữ số).', a: '249.4' },
 { q: 'Một xe máy tăng từ 5m/s lên 25m/s trong 8 giây, sau đó chạy đều 6 giây. Tính tổng quãng đường đi (làm tròn 2 chữ số).', a: '220.00' },
{ q: 'Một vật ném thẳng đứng lên 30m/s. Sau 2 giây, vật đạt độ cao bao nhiêu? (làm tròn 2 chữ số)', a: '20.40' },
{ q: 'Một viên đá rơi từ 200m, sau 3 giây bị gió thổi làm giảm gia tốc còn 6m/s². Tính thời gian chạm đất (làm tròn 2 chữ số).', a: '6.83' },
{ q: 'Một xe đang chạy 28m/s, thắng gấp với giảm tốc 6m/s². Khi còn 10m/s thì tài xế đạp ga tăng 3m/s² trong 4 giây. Tính quãng đường tổng (làm tròn 1 chữ số).', a: '79.5' },
{ q: 'Một máy bay tăng tốc 3m/s² trong 12 giây, sau đó tăng tốc tiếp 1.5m/s² trong 10 giây. Tính vận tốc cuối (làm tròn 1 chữ số).', a: '64.5' },
{ q: 'Một vật được kéo với lực làm tăng tốc 4m/s² trong 3 giây, sau đó tăng gấp đôi gia tốc thêm 2 giây. Tính vận tốc cuối (làm tròn 2 chữ số).', a: '22.00' },
{ q: 'Một quả bóng nảy từ độ cao 80m, mỗi lần nảy đạt 65%. Sau 4 lần nảy, tính độ cao (làm tròn 2 chữ số).', a: '14.22' },
{ q: 'Một vật trượt xuống dốc đạt vận tốc 18m/s rồi tiếp tục được kéo tăng 2.5m/s² trong 6 giây. Tính vận tốc cuối (làm tròn 1 chữ số).', a: '33.0' },


{ q: 'Một xe tăng tốc 2m/s² trong 9 giây, rồi giảm 1m/s² trong 7 giây. Tính vận tốc cuối (làm tròn 2 chữ số).', a: '11.00' },
{ q: 'Một vật rơi tự do 5 giây, sau đó dù mở làm gia tốc còn 3m/s². Tính vận tốc khi chạm đất sau thêm 4 giây (làm tròn 1 chữ số).', a: '62.0' },
{ q: 'Một tàu đang đi 10m/s, tăng 2m/s² trong 5 giây, rồi đi đều 8 giây. Tính quãng đường tổng (làm tròn 2 chữ số).', a: '150.00' },
{ q: 'Một xe đạp đang đi 6m/s, tăng 1.5m/s² trong 10 giây rồi dừng lại với giảm tốc 2m/s². Tính quãng đường tổng (làm tròn 1 chữ số).', a: '122.5' },
{ q: 'Một quả bóng được ném lên 22m/s. Sau 1.8 giây bóng ở độ cao bao nhiêu (g=9.8, làm tròn 2 chữ số)?', a: '12.44' },
{ q: 'Một vật rơi từ 150m. Sau 2 giây, gió đổi chiều làm gia tốc còn 7m/s². Tính thời gian rơi (làm tròn 2 chữ số).', a: '5.53' },
{ q: 'Một xe chạy 25m/s rồi tăng đều đến 40m/s trong 6 giây. Sau đó chạy đều 5 giây. Tính quãng đường tổng (làm tròn 2 chữ số).', a: '325.00' },
{ q: 'Một rocket lao xuống từ 300m với gia tốc 12m/s², nhưng sau 2 giây bật ngược lực đẩy giảm gia tốc còn 4m/s². Tính thời gian chạm đất (làm tròn 2 chữ số).', a: '6.21' },
{ q: 'Một xe mô tô chạy 18m/s, tăng tốc 4m/s² trong 4 giây rồi giảm tốc 2m/s² trong 5 giây. Tính vận tốc cuối (làm tròn 2 chữ số).', a: '20.00' },
{ q: 'Một vật được ném xuống 12m/s, gia tốc 9.8m/s² trong 3 giây rồi tiếp đất. Tính quãng đường (làm tròn 1 chữ số).', a: '94.5' },
  ];

  // === Tạo element báo lỗi trong popup ===
  const errorEl = document.createElement('p');
  errorEl.style.color = 'salmon';
  errorEl.style.display = 'none';
  errorEl.style.marginTop = '6px';
  errorEl.style.fontSize = '13px';
  errorEl.textContent = 'Sai rồi, thử lại nhé!';
  popupContent.appendChild(errorEl);

  // === Helper ===
  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function randChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function clamp(v, min, max) {
    return v < min ? min : v > max ? max : v;
  }

  function rectIntersect(a, b) {
    return !(
      a.x + a.w < b.x ||
      a.x > b.x + b.w ||
      a.y + a.h < b.y ||
      a.y > b.y + b.h
    );
  }

  function normalizeAnswer(str) {
    let s = (str || '').trim().toLowerCase();
    s = s.replace(',', '.');
    return s;
  }
function spawnItem() {
  const lane = randInt(0, laneCount - 1);
  const x = roadX + lane * laneWidth + laneWidth / 2 - 15;
  const y = -50;
  const w = 30;
  const h = 30;

  const type = Math.random() < 0.5 ? ITEM_TYPES.SHIELD : ITEM_TYPES.FREEPASS;

  items.push({ x, y, w, h, type, speed: currentSpeed + 1 });
}

  function answersEqual(user, correct) {
    const uNorm = normalizeAnswer(user);
    const cNorm = normalizeAnswer(correct);

    // Thử so sánh số (cho phép sai số nhỏ)
    const uNum = parseFloat(uNorm);
    const cNum = parseFloat(cNorm);
    if (!Number.isNaN(uNum) && !Number.isNaN(cNum)) {
      return Math.abs(uNum - cNum) < 1e-3;
    }

    // So sánh chuỗi
    return uNorm === cNorm;
  }

  // === Question Popup ===
  function showQuestion() {
    inQuestion = true;
    running = false;
    currentQuestion = randChoice(questions);
    questionText.textContent = currentQuestion.q;
    answerInput.value = '';
    errorEl.style.display = 'none';

    popup.style.display = 'flex';
    setTimeout(() => {
      answerInput.focus();
    }, 10);
  }

  function hideQuestion() {
    popup.style.display = 'none';
    inQuestion = false;
  }

  function onCorrectAnswer() {
  // Thưởng nitro, giữ điểm, tiếp tục chơi
  nitro = clamp(nitro + 30, 0, 100);

  // Xóa hết xe địch để không đụng lại ngay lập tức
  enemies = [];
  spawnTimer = 0;

  hideQuestion();
  inQuestion = false;
  running = true;
}


  function onGiveUpOrFail() {
    hideQuestion();
    endGame();
  }

  // === Game control ===
const keys = {
  left: false,
  right: false,
  up: false,
  down: false,
  nitro: false,
};

  window.addEventListener('keydown', (e) => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = true;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = true;
    if (e.code === "ArrowUp" || e.code === "KeyW") keys.up = true;
    if (e.code === "ArrowDown" || e.code === "KeyS") keys.down = true;
    if (e.code === 'Space') keys.nitro = true;
  });

  window.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = false;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = false;
    if (e.code === "ArrowUp" || e.code === "KeyW") keys.up = false;
    if (e.code === "ArrowDown" || e.code === "KeyS") keys.down = false;

    if (e.code === 'Space') keys.nitro = false;
  });

  // Mobile: chạm trái/phải để rẽ, 2 ngón = nitro
  function handlePointerDown(ev) {
    const touches = ev.touches ? ev.touches.length : 1;

    if (touches >= 2) {
      keys.nitro = true;
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const x = (ev.touches ? ev.touches[0].clientX : ev.clientX) - rect.left;

    if (x < rect.width / 2) {
      keys.left = true;
      keys.right = false;
    } else {
      keys.right = true;
      keys.left = false;
    }
  }

  function handlePointerUp() {
    keys.left = false;
    keys.right = false;
    keys.nitro = false;
  }

  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    handlePointerDown(e);
  }, { passive: false });
  canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    handlePointerUp();
  }, { passive: false });
  canvas.addEventListener('mousedown', (e) => {
    e.preventDefault();
    handlePointerDown(e);
  });
  canvas.addEventListener('mouseup', (e) => {
    e.preventDefault();
    handlePointerUp();
  });

  // === Enemy spawn / reset ===
  function spawnEnemy() {
    const lane = randInt(0, laneCount - 1);
    const x = roadX + lane * laneWidth + laneWidth / 2 - 18;
    const y = -80;
    const w = 36;
    const h = 70;
    const speed = currentSpeed + 1 + Math.random() * 0.8;

    enemies.push({ x, y, w, h, speed });
  }

  function resetAfterCrash() {
    enemies = [];
    spawnTimer = 0;
    spawnInterval = 900;
    difficultyTime = 0;

    player.x = roadX + laneWidth * 1 + laneWidth / 2 - player.w / 2;
    player.y = H - 110;

    roadOffset = 0;
  }

  function endGame() {
    running = false;

    // Cập nhật best
    if (score > best) {
      best = score;
      bestEl.textContent = best.toString();
      try {
        localStorage.setItem('ne-xe-best', best.toString());
      } catch (e) {
        // ignore
      }
    }

    // Hiện text "Game Over" bằng canvas (không popup)
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff';
    ctx.font = '28px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', W / 2, H / 2 - 10);
    ctx.font = '16px monospace';
    ctx.fillText('Nhấn Enter để chơi lại', W / 2, H / 2 + 20);
    ctx.restore();
  }

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Enter' && !running && !inQuestion) {
      // reset full game
      score = 0;
      nitro = 60;
      resetAfterCrash();
      running = true;
    }
  });

  // === Question events ===
 submitBtn.addEventListener('click', () => {
    if (!currentQuestion) return;

    const val = answerInput.value;

    if (answersEqual(val, currentQuestion.a)) {
        // 🟢 Trả lời đúng → tiếp tục game
        onCorrectAnswer();
    } else {
        // ❌ Trả lời sai
        if (freePass > 0) {
            // 🟡 Có free-pass → không thua, chỉ trừ 1
            freePass--;
            hideQuestion();
            running = true;
        } else {
            // 🔴 Không có free-pass → reset từ đầu
            onGiveUpOrFail();
        }
    }
});

// Nhấn Enter để trả lời
answerInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        submitBtn.click();
    }
});

// Bấm nút Từ Bỏ → reset từ đầu
giveUpBtn.addEventListener('click', () => {
    onGiveUpOrFail();
});




  // === Update / Draw ===
function update(dt) {
  if (!running) return;

  const dtSec = dt / 1000;
  difficultyTime += dt;

  // =================================
  //  SPEED TĂNG THEO THỜI GIAN
  // =================================
  baseSpeed = 2.7 + difficultyTime / 60000;
  currentSpeed = baseSpeed;

  // =================================
  //  NITRO
  // =================================
  let usingNitro = false;
  if (keys.nitro && nitro > 0) {
    usingNitro = true;
    currentSpeed *= 1.8;
    nitro -= 28 * dtSec;
  } else {
    nitro += 8 * dtSec;
  }
  nitro = clamp(nitro, 0, 100);

  // HUD update
  speedEl.textContent = currentSpeed.toFixed(1);
  nitroMeterEl.style.width = nitro + "%";

  // =================================
  //  PLAYER MOVE 4 CHIỀU
  // =================================
  let dirX = 0;
  let dirY = 0;

  if (keys.left) dirX -= 1;
  if (keys.right) dirX += 1;
  if (keys.up) dirY -= 1;
  if (keys.down) dirY += 1;

  const moveSpeed = usingNitro ? 260 : 180;

  player.x += dirX * moveSpeed * dtSec;
  player.y += dirY * moveSpeed * dtSec;

  // giới hạn trái phải
  const minX = roadX + 4;
  const maxX = roadX + roadWidth - player.w - 4;
  player.x = clamp(player.x, minX, maxX);

  // giới hạn lên xuống
  const minY = 50;
  const maxY = H - player.h - 20;
  player.y = clamp(player.y, minY, maxY);

  // =================================
  //  ROAD SCROLL
  // =================================
  roadOffset += currentSpeed * 2;
  if (roadOffset > 40) roadOffset -= 40;

  // =================================
  //  ENEMY MOVEMENT
  // =================================
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    e.y += e.speed * 60 * dtSec;

    if (e.y > H + 80) {
      enemies.splice(i, 1);
      score += 1;
    }
  }

  // =================================
  //  ITEM MOVEMENT
  // =================================
  for (let i = items.length - 1; i >= 0; i--) {
    const it = items[i];
    it.y += (currentSpeed + 1) * 60 * dtSec;

    if (it.y > H + 100) {
      items.splice(i, 1);
      continue;
    }
  }

  // =================================
  //  SPAWN ENEMY + ITEM
  // =================================
  spawnTimer += dt;

  if (spawnTimer >= spawnInterval) {
    spawnTimer = 0;
    spawnEnemy();
    if (spawnInterval > 450) spawnInterval -= 15;
  }

  // 2% cơ hội spawn item mỗi tick ~ 5–8s mới có 1 cái
  if (Math.random() < 0.007) {
    spawnItem();
  }

  // =================================
  //  NHẶT VẬT PHẨM
  // =================================
  for (let i = items.length - 1; i >= 0; i--) {
    const it = items[i];

    if (rectIntersect(player, it)) {
      if (it.type === ITEM_TYPES.SHIELD) {
        shieldActive = true;
        shieldTimer = 7000; // 7 giây
      }

      if (it.type === ITEM_TYPES.FREEPASS) {
        freePass += 1;
      }

      items.splice(i, 1);
    }
  }

  // =================================
  //  SHIELD TIMER GIẢM
  // =================================
  if (shieldActive) {
    shieldTimer -= dt;
    if (shieldTimer <= 0) shieldActive = false;
  }

  // =================================
  //  CHECK VA CHẠM ENEMY
  // =================================
  for (let i = 0; i < enemies.length; i++) {
    if (rectIntersect(player, enemies[i])) {

      if (shieldActive) {
        // có khiên → miễn sát thương
        enemies.splice(i, 1);
        continue;
      }

      // không có khiên → bật câu hỏi
      running = false;
      showQuestion();
      break;
    }
  }

  // HUD điểm
  scoreEl.textContent = score.toString();
}


  function drawRoad() {
    // nền ngoài đường
    ctx.fillStyle = '#1b222c';
    ctx.fillRect(0, 0, W, H);

    // đường
    ctx.fillStyle = '#303943';
    ctx.fillRect(roadX, 0, roadWidth, H);

    // vạch biên
    ctx.fillStyle = '#d0e6ff';
    ctx.fillRect(roadX - 4, 0, 4, H);
    ctx.fillRect(roadX + roadWidth, 0, 4, H);

    // vạch phân làn
    ctx.fillStyle = '#f5f7ff';
    const dashH = 30;
    const gap = 30;
    for (let lane = 1; lane < laneCount; lane++) {
      const x = roadX + lane * laneWidth;
      for (let y = -dashH; y < H + dashH; y += dashH + gap) {
        const yy = y + (roadOffset % (dashH + gap));
        ctx.fillRect(x - 2, yy, 4, dashH);
      }
    }
  }
function drawItems() {
  for (const it of items) {
    if (it.type === ITEM_TYPES.SHIELD) {
      ctx.fillStyle = "#00eaff"; // xanh khiên
    } else {
      ctx.fillStyle = "#ffdd00"; // vàng free-pass
    }

    ctx.beginPath();
    ctx.arc(it.x + it.w/2, it.y + it.h/2, it.w/2, 0, Math.PI * 2);
    ctx.fill();
  }
}

  function drawPlayer() {
    ctx.save();
    ctx.fillStyle = '#4af';
    ctx.fillRect(player.x, player.y, player.w, player.h);
    // kính
    ctx.fillStyle = '#cfe';
    ctx.fillRect(player.x + 6, player.y + 10, player.w - 12, 18);
    // đèn hậu
    ctx.fillStyle = '#ff6666';
    ctx.fillRect(player.x + 4, player.y + player.h - 8, player.w - 8, 4);
    ctx.restore();
  }

  function drawEnemies() {
    ctx.save();
    for (const e of enemies) {
      ctx.fillStyle = '#f55';
      ctx.fillRect(e.x, e.y, e.w, e.h);
      ctx.fillStyle = '#222';
      ctx.fillRect(e.x + 6, e.y + 10, e.w - 12, 18);
    }
    ctx.restore();
  }

  function loop(now) {
    const dt = Math.min(40, now - lastTime);
    lastTime = now;

    update(dt);

    // Vẽ cảnh
    drawRoad();
    drawEnemies();
    drawPlayer();
    drawItems();
    requestAnimationFrame(loop);
  }

  resetAfterCrash();
  requestAnimationFrame(loop);
})();
