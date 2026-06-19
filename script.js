// --- LÓGICA Y ACCESIBILIDAD PARA LA TIENDITA RURAL ---

// --- 1. SINTETIZADOR DE AUDIO (Web Audio API) ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type, step = 0) {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    const now = audioCtx.currentTime;

    if (type === 'beep') {
        // Clic de navegación
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
    } else if (type === 'coin') {
        // Sonido de moneda
        osc.type = 'sine';
        osc.frequency.setValueAtTime(987.77, now); // Si5
        osc.frequency.exponentialRampToValueAtTime(1318.51, now + 0.08); // Mi6
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
    } else if (type === 'count') {
        // Tono ascendente al contar
        osc.type = 'triangle';
        const freq = 220 * Math.pow(1.122, step); // Escala musical según el paso
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.start(now);
        osc.stop(now + 0.18);
    } else if (type === 'success') {
        // Fanfarria de victoria corta
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
            const noteOsc = audioCtx.createOscillator();
            const noteGain = audioCtx.createGain();
            noteOsc.connect(noteGain);
            noteGain.connect(audioCtx.destination);
            
            noteOsc.type = 'sine';
            noteOsc.frequency.setValueAtTime(freq, now + idx * 0.1);
            noteGain.gain.setValueAtTime(0.1, now + idx * 0.1);
            noteGain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.25);
            
            noteOsc.start(now + idx * 0.1);
            noteOsc.stop(now + idx * 0.1 + 0.25);
        });
    } else if (type === 'error') {
        // Sonido grave de error
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.linearRampToValueAtTime(100, now + 0.35);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
    }
}

// --- 2. SISTEMA DE LECTOR DE PANTALLA INTEGRADO (SpeechSynthesis) ---
let ttsEnabled = true;
let voicesReady = false;

function initSpeech() {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.getVoices();
        voicesReady = true;
    }
}
initSpeech();
if (window.speechSynthesis && window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = initSpeech;
}

function speak(text) {
    if (!ttsEnabled) return;
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); // Detener audios anteriores inmediatos
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'es-MX'; // Forzar español mexicano o latino
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
    }
    
    // Live Announcer para lectores externos
    const announcer = document.getElementById('live-announcer');
    if (announcer) {
        announcer.textContent = '';
        setTimeout(() => {
            announcer.textContent = text;
        }, 50);
    }
}

// Función helper para adjuntar voz a botones estáticos
function makeAccessible(element, speechText) {
    element.addEventListener('focus', () => {
        playSound('beep');
        speak(speechText);
    });
    element.addEventListener('mouseenter', () => {
        speak(speechText);
    });
}

// --- 3. CONFIGURACIONES GENERALES Y ACCESIBILIDAD ---
let zoomPercent = 100;
let currentGrade = 1;

// Lógica de Zoom
function updateZoom() {
    document.documentElement.style.setProperty('--base-font-size', `${zoomPercent}%`);
    speak(`Tamaño de letra al ${zoomPercent} por ciento`);
}

document.getElementById('btn-zoom-in').addEventListener('click', () => {
    playSound('beep');
    if (zoomPercent < 160) {
        zoomPercent += 15;
        updateZoom();
    } else {
        speak("Ya estás en el tamaño máximo de letra.");
    }
});

document.getElementById('btn-zoom-out').addEventListener('click', () => {
    playSound('beep');
    if (zoomPercent > 100) {
        zoomPercent -= 15;
        updateZoom();
    } else {
        speak("Ya estás en el tamaño mínimo de letra.");
    }
});

// Lógica de Voz
const btnTts = document.getElementById('btn-tts-toggle');
btnTts.addEventListener('click', () => {
    ttsEnabled = !ttsEnabled;
    playSound('beep');
    if (ttsEnabled) {
        btnTts.textContent = "🔊 Voz Activa";
        btnTts.setAttribute('aria-label', "Desactivar voz guía");
        speak("Voz guía activada");
    } else {
        btnTts.textContent = "🔇 Voz Silenciada";
        btnTts.setAttribute('aria-label', "Activar voz guía");
    }
});

// Alternar Contraste
const btnTheme = document.getElementById('btn-theme-toggle');
btnTheme.addEventListener('click', () => {
    playSound('beep');
    const body = document.body;
    body.classList.toggle('high-contrast-theme');
    if (body.classList.contains('high-contrast-theme')) {
        speak("Tema de alto contraste negro y amarillo activado");
    } else {
        speak("Tema alegre por defecto activado");
    }
});

// --- 4. MANEJO DE PANTALLAS ---
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(screenId);
    target.classList.add('active');
    
    // Enfocar cabecera para lectura automática al cambiar pantalla
    let titleEl = target.querySelector('h1, h2');
    if (titleEl) {
        titleEl.focus();
    }
}

// Botones para volver al menú
document.querySelectorAll('.back-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        playSound('beep');
        showScreen('main-menu');
        speak("Regresaste al menú principal. ¿Qué grado quieres jugar?");
    });
});

// --- 5. JUEGOS POR GRADOS ---

// Emojis de elementos rurales para contar
const RURAL_ITEMS = [
    { emoji: '🥚', name: 'huevos', singular: 'huevo' },
    { emoji: '🍅', name: 'tomates', singular: 'tomate' },
    { emoji: '🌽', name: 'elotes', singular: 'elote' },
    { emoji: '🐄', name: 'vacas', singular: 'vaca' },
    { emoji: '🐔', name: 'gallinas', singular: 'gallina' },
    { emoji: '🍎', name: 'manzanas', singular: 'manzana' }
];

let g1TargetCount = 0;
let g1CountedItems = new Set();
let g1ItemData = {};

function startGrade1() {
    currentGrade = 1;
    g1CountedItems.clear();
    g1TargetCount = Math.floor(Math.random() * 8) + 3; // Entre 3 y 10
    g1ItemData = RURAL_ITEMS[Math.floor(Math.random() * RURAL_ITEMS.length)];

    const container = document.getElementById('g1-items-container');
    container.innerHTML = '';

    // Anunciar instrucciones
    const levelIntro = `Grado uno: A contar el campo. ¿Cuántos objetos hay? Cuenta las ${g1ItemData.name} haciendo clic sobre ellas y selecciona la respuesta correcta.`;
    speak(levelIntro);
    document.getElementById('g1-instruction').textContent = `¿Cuántas ${g1ItemData.name} hay? ¡Haz clic en cada una para contarlas!`;

    // Generar elementos
    for (let i = 1; i <= g1TargetCount; i++) {
        const itemBtn = document.createElement('button');
        itemBtn.className = 'count-item';
        itemBtn.innerHTML = g1ItemData.emoji;
        itemBtn.setAttribute('tabindex', '0');
        itemBtn.setAttribute('aria-label', `${g1ItemData.singular} número ${i}`);

        // Evento de hover y foco
        makeAccessible(itemBtn, `${g1ItemData.singular} número ${i}`);

        itemBtn.addEventListener('click', () => {
            if (!g1CountedItems.has(i)) {
                g1CountedItems.add(i);
                itemBtn.classList.add('counted');
                
                // Añadir número de cuenta visual
                const numBadge = document.createElement('div');
                numBadge.className = 'count-number';
                numBadge.textContent = g1CountedItems.size;
                itemBtn.appendChild(numBadge);

                // Sonido e indicación oral del conteo actual
                playSound('count', g1CountedItems.size);
                speak(`${g1CountedItems.size}`);
                itemBtn.setAttribute('aria-label', `${g1ItemData.singular} número ${i}. Ya contado.`);
            } else {
                speak(`Ya contaste esta ${g1ItemData.singular}`);
            }
        });

        container.appendChild(itemBtn);
    }

    // Generar opciones
    const optionsContainer = document.getElementById('g1-options-container');
    optionsContainer.innerHTML = '';

    const options = [g1TargetCount];
    while (options.length < 3) {
        const fake = Math.max(1, g1TargetCount + Math.floor(Math.random() * 5) - 2);
        if (!options.includes(fake)) {
            options.push(fake);
        }
    }
    options.sort((a, b) => a - b);

    options.forEach(opt => {
        const optBtn = document.createElement('button');
        optBtn.className = 'btn primary option-btn';
        optBtn.textContent = opt;
        optBtn.setAttribute('aria-label', `Responder: ¿Hay ${opt}?`);
        
        makeAccessible(optBtn, `Responder: ¿Hay ${opt}?`);

        optBtn.addEventListener('click', () => {
            if (opt === g1TargetCount) {
                playSound('success');
                speak(`¡Muy bien! ¡Respuesta correcta! Hay exactamente ${g1TargetCount} ${g1ItemData.name}.`);
                showCelebration(`¡Muy bien! Encontraste las ${g1TargetCount} ${g1ItemData.name}.`);
            } else {
                playSound('error');
                speak(`¡Oh oh! Contaste ${opt}, pero esa no es la cantidad. Llevas contadas ${g1CountedItems.size} ${g1ItemData.name}. ¡Sigue contando!`);
            }
        });

        optionsContainer.appendChild(optBtn);
    });
}

// --- Grado 2: Conoce tus Monedas ---
const COINS = [
    { value: 1, name: 'Un peso', desc: 'Moneda de un peso. Tiene el centro de bronce y el borde plateado.', symbol: '🪙' },
    { value: 2, name: 'Dos pesos', desc: 'Moneda de dos pesos. Es un poco más grande que la de un peso.', symbol: '🪙' },
    { value: 5, name: 'Cinco pesos', desc: 'Moneda de cinco pesos. Su borde es más ancho.', symbol: '🪙' },
    { value: 10, name: 'Diez pesos', desc: 'Moneda de diez pesos. Es la más grande, tiene el centro dorado y borde plateado.', symbol: '🪙' }
];
let g2TargetCoin = COINS[0];

// Inicializar listeners estáticos del mostrador de monedas de Grado 2 una sola vez para evitar acumulación
const g2CoinDisplay = document.getElementById('g2-coin-display');
g2CoinDisplay.addEventListener('focus', () => {
    playSound('beep');
    speak(g2TargetCoin.desc);
});
g2CoinDisplay.addEventListener('mouseenter', () => {
    speak(g2TargetCoin.desc);
});

function startGrade2() {
    currentGrade = 2;
    g2TargetCoin = COINS[Math.floor(Math.random() * COINS.length)];

    // Mostramos un diseño circular sin decir explícitamente el valor en texto directo
    g2CoinDisplay.innerHTML = `<span style="font-size: 5rem; display:block;">🪙</span>¿Cuánto vale esta moneda?`;
    g2CoinDisplay.setAttribute('aria-label', g2TargetCoin.desc);

    const levelIntro = `Grado dos: Conoce tus monedas. Escucha la descripción de la moneda en el centro de la pantalla pasando el ratón o enfocándola con tabulador, y selecciona cuál es su valor correcto en las opciones de abajo.`;
    speak(levelIntro);

    const optionsContainer = document.getElementById('g2-options-container');
    optionsContainer.innerHTML = ''; // Los botones se recrean, por lo que no acumulan listeners

    COINS.forEach(coin => {
        const optBtn = document.createElement('button');
        optBtn.className = 'btn secondary option-btn';
        optBtn.textContent = `$${coin.value}`;
        optBtn.setAttribute('aria-label', `Responder: Moneda de ${coin.name}`);

        makeAccessible(optBtn, `Responder: Moneda de ${coin.name}`);

        optBtn.addEventListener('click', () => {
            if (coin.value === g2TargetCoin.value) {
                playSound('success');
                speak(`¡Excelente! Sí, esta moneda vale ${g2TargetCoin.name}.`);
                showCelebration(`¡Excelente! Esta moneda es de ${g2TargetCoin.name}.`);
            } else {
                playSound('error');
                speak(`¡Oh oh! Elegiste ${coin.name}, pero esta moneda no vale eso. Vuelve a tocar la moneda en el centro para escuchar su descripción.`);
            }
        });

        optionsContainer.appendChild(optBtn);
    });
}

// --- Grado 3: Comprar en la Tienda ---
const PRODUCTS = [
    { name: 'Leche fresca 🥛', singular: 'Leche fresca', minPrice: 12, maxPrice: 18 },
    { name: 'Pan dulce 🍞', singular: 'Pan dulce', minPrice: 6, maxPrice: 10 },
    { name: 'Elote tierno 🌽', singular: 'Elote tierno', minPrice: 4, maxPrice: 8 },
    { name: 'Zanahoria fresca 🥕', singular: 'Zanahoria fresca', minPrice: 3, maxPrice: 6 },
    { name: 'Queso del rancho 🧀', singular: 'Queso del rancho', minPrice: 15, maxPrice: 22 },
    { name: 'Manzana roja 🍎', singular: 'Manzana roja', minPrice: 5, maxPrice: 12 }
];

let g3Product = PRODUCTS[0];
let g3Price = 0;
let g3CurrentPayment = 0;

// Inicializar listeners estáticos del producto y precio una sola vez para evitar acumulación
const g3ProductEl = document.getElementById('g3-product');
const g3PriceEl = document.getElementById('g3-price');

g3ProductEl.addEventListener('focus', () => {
    playSound('beep');
    speak(`Artículo a comprar: ${g3Product.singular}`);
});
g3ProductEl.addEventListener('mouseenter', () => {
    speak(`Artículo a comprar: ${g3Product.singular}`);
});

g3PriceEl.addEventListener('focus', () => {
    playSound('beep');
    speak(`El precio de la ${g3Product.singular} es de ${g3Price} pesos.`);
});
g3PriceEl.addEventListener('mouseenter', () => {
    speak(`El precio de la ${g3Product.singular} es de ${g3Price} pesos.`);
});

// Inicializar listeners de monedas del monedero de Grado 3 UNA SOLA VEZ (Evita sumas duplicadas o multiplicadas)
document.querySelectorAll('#g3-wallet .coin').forEach(coinBtn => {
    const val = parseInt(coinBtn.getAttribute('data-val'));
    
    makeAccessible(coinBtn, `Moneda de ${val} ${val === 1 ? 'peso' : 'pesos'}`);

    coinBtn.addEventListener('click', () => {
        g3CurrentPayment += val;
        document.getElementById('g3-current-amount').textContent = g3CurrentPayment;
        playSound('coin');
        speak(`Pusiste ${val} ${val === 1 ? 'peso' : 'pesos'}. Llevas acumulado ${g3CurrentPayment} pesos de un total de ${g3Price}.`);
    });
});

function startGrade3() {
    currentGrade = 3;
    g3CurrentPayment = 0;
    
    const baseProd = PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)];
    g3Price = Math.floor(Math.random() * (baseProd.maxPrice - baseProd.minPrice + 1)) + baseProd.minPrice;
    g3Product = baseProd;

    document.getElementById('g3-product').textContent = g3Product.name;
    document.getElementById('g3-price').textContent = `$${g3Price}`;
    document.getElementById('g3-current-amount').textContent = g3CurrentPayment;

    const levelIntro = `Grado tres: Comprar en la tienda. Vamos a comprar ${g3Product.singular} que cuesta ${g3Price} pesos. Selecciona las monedas del monedero para pagar y presiona comprar cuando tengas la cantidad exacta.`;
    speak(levelIntro);
}

// Limpiar monedero
document.getElementById('g3-clear').addEventListener('click', () => {
    g3CurrentPayment = 0;
    document.getElementById('g3-current-amount').textContent = g3CurrentPayment;
    playSound('beep');
    speak("Monedero vacío. Llevas cero pesos acumulados.");
});

// Comprar / Verificar
document.getElementById('g3-buy').addEventListener('click', () => {
    if (g3CurrentPayment === g3Price) {
        playSound('success');
        speak(`¡Compra exitosa! Pagaste exactamente los ${g3Price} pesos de la ${g3Product.singular}. ¡Buen trabajo!`);
        showCelebration(`¡Compra exitosa! Pagaste los $${g3Price} pesos.`);
    } else if (g3CurrentPayment > g3Price) {
        playSound('error');
        const diff = g3CurrentPayment - g3Price;
        speak(`¡Oh oh! Pusiste de más. Llevas ${g3CurrentPayment} pesos, pero cuesta ${g3Price}. Pusiste ${diff} pesos de sobra. Presiona limpiar e inténtalo de nuevo.`);
    } else {
        playSound('error');
        const diff = g3Price - g3CurrentPayment;
        speak(`¡Oh oh! Te falta dinero. Llevas ${g3CurrentPayment} pesos, pero cuesta ${g3Price}. Te faltan ${diff} pesos. ¡Sigue agregando monedas!`);
    }
});

// --- 6. CELEBRACIÓN ---
const nextBtn = document.getElementById('next-btn');
makeAccessible(nextBtn, "Ir al siguiente juego.");

function showCelebration(msgText) {
    document.getElementById('celebration-msg').textContent = msgText;
    showScreen('celebration-screen');
}

nextBtn.addEventListener('click', () => {
    playSound('beep');
    document.getElementById('celebration-screen').classList.remove('active');
    
    if (currentGrade === 1) {
        startGrade1();
        showScreen('game-grade-1');
    } else if (currentGrade === 2) {
        startGrade2();
        showScreen('game-grade-2');
    } else if (currentGrade === 3) {
        startGrade3();
        showScreen('game-grade-3');
    }
});

// --- 7. INICIACIÓN Y NAVEGACIÓN DE BOTONES DEL MENÚ ---
document.querySelectorAll('.grade-btn').forEach(btn => {
    const grade = parseInt(btn.getAttribute('data-start'));
    let gradeName = "";
    if (grade === 1) gradeName = "Primer Grado: A Contar el Campo";
    if (grade === 2) gradeName = "Segundo Grado: Conoce tus Monedas";
    if (grade === 3) gradeName = "Tercer Grado: Comprar en la Tienda";

    makeAccessible(btn, `Jugar ${gradeName}`);

    btn.addEventListener('click', () => {
        playSound('beep');
        if (grade === 1) {
            startGrade1();
            showScreen('game-grade-1');
        } else if (grade === 2) {
            startGrade2();
            showScreen('game-grade-2');
        } else if (grade === 3) {
            startGrade3();
            showScreen('game-grade-3');
        }
    });
});

// Narrar pantalla de inicio al cargar
window.addEventListener('load', () => {
    setTimeout(() => {
        speak("¡Bienvenido a La Tiendita Rural! Selecciona primer grado, segundo grado o tercer grado para empezar a jugar.");
    }, 1000);

    makeAccessible(document.querySelector('#main-menu h1'), "La Tiendita Rural");
    makeAccessible(document.querySelector('#main-menu .subtitle'), "Aprende los números y monedas de nuestro pueblo de forma divertida");
});
