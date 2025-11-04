// --- DOM & état ---
// Sélection des éléments du DOM
const display = document.getElementById("display");
const buttons = document.querySelectorAll(".keyboard button");

if (!display) {
  console.error("Élément d’affichage introuvable !");
}

// Variables d'état principales de la calculatrice
let currentInput = "0"; // Valeur actuellement affichée
let firstOperand = null; // Premier opérande (utilisé lors d’une opération)
let operator = null; // Opérateur sélectionné (+, -, etc.)
let waitingForSecondOperand = false; // Indique si on attend le deuxième nombre
let memory = 0; // Valeur mise en mémoire
let memoryIsRecalled = false; // Indique si la dernière action mémoire était un rappel (true) ou non (false)
const limitChar = 9;

// --- Initialisation ---
// Ajout des écouteurs d'événements sur chaque bouton
buttons.forEach((button) => {
  button.addEventListener("click", () => handleButtonClick(button));
});

// Affiche la valeur initiale au démarrage
updateDisplay();

// --- Gestionnaire principal ---
/**
 * Gère le clic sur un bouton de la calculatrice.
 * 
 * Détermine le type de bouton cliqué (nombre, point, opérateur, action spéciale)
 * à partir des attributs `data-action` et `data-key` du bouton, 
 * puis délègue le traitement à la fonction appropriée.
 * 
 * Après traitement, met à jour l'affichage de la calculatrice.
 * 
 * @param {HTMLElement} button - Le bouton cliqué, contenant les attributs :
 *   - `data-action` : le type d'action ("number", "operator", "special")
 *   - `data-key` : la valeur ou l'opérateur associé au bouton
 */
function handleButtonClick(button) {
  const action = button.dataset.action;
  const keyValue = button.dataset.key; // Récupère la valeur associée au bouton

  resetMemoryRecallFlag(action, keyValue);

  switch (action) {
    case "number":
      if (keyValue === ".")
        handleDotInput(keyValue);
      else
        handleNumberInput(keyValue);
      break;
    case "operator":
      if (keyValue === "=")
        handleEqualInput();
      else
        handleOperatorInput(keyValue);
      break;
    case "special":
      handleSpecialInput(keyValue);
      break;
    case "memory":
      handleMemoryInput(keyValue);
      break;
    default:
      console.warn(`Action inconnue détectée : "${action}"`);
      break;
  }

  numberLimit(); // Vérifie la longueur du nombre après chaque action
  updateDisplay(); // Met à jour l’écran après chaque action
}

// --- Affichage ---
/**
 * Met à jour le contenu de l’écran avec la valeur courante.
 */
function updateDisplay() {
  display.textContent = currentInput;
}

/**
 * Limite la longueur de currentInput lors de la saisie à 9 caractères.
 * Si la longueur dépasse 9 caractères, affiche "E0000000".
 */
function numberLimit() {
  if (currentInput.length > limitChar) {
    currentInput = "E0000000"; // Affichage d'erreur si plus de 8 caractères
    waitingForSecondOperand = false; // On empêche de saisir d'autres chiffres
  }
}

// --- Saisie ---
/**
 * Gère l'entrée des chiffres.
 * - Remplace le zéro initial si besoin.
 * - Concatène les chiffres pour former un nombre complet.
 * - Réinitialise correctement l’état si on attendait un second opérande.
 */
function handleNumberInput(keyValue) {
  if (waitingForSecondOperand) {
    // Si on vient de saisir un opérateur, on démarre un nouveau nombre
    currentInput = keyValue;
    waitingForSecondOperand = false;
  } else if (currentInput === "0" && keyValue === "0") {
    currentInput = "0"; // Évite plusieurs zéros consécutifs au début
  } else if (currentInput === "0") {
    currentInput = keyValue; // Remplace le zéro initial
  } else {
    currentInput += keyValue; // Ajoute le chiffre à la fin du nombre courant
  }
}

/**
 * Gère l'entrée du point décimal.
 * - Si on attend un second opérande, commence un nouveau nombre avec '0.'
 * - Empêche d’ajouter plusieurs points dans le même nombre.
 */
function handleDotInput(keyValue) {
  if (waitingForSecondOperand) {
    currentInput = "0."; // Démarre un nouveau nombre décimal
    waitingForSecondOperand = false; // Sort de l’état d’attente
  }

  if (!currentInput.includes("."))
    // Empêche les doublons de point
    currentInput += keyValue;
}

/**
 * Gère la saisie d'un opérateur (+, -, *, /)
 */
function handleOperatorInput(nextOperator) {
  const inputValue = parseFloat(currentInput);

  // Si firstOperand est null, c'est le début d'une nouvelle chaîne de calcul
  if (firstOperand === null) {
    firstOperand = inputValue;
  } else if (operator) {
    // Si un opérateur précédent existe, effectuer le calcul
    const result = performCalculation(firstOperand, inputValue, operator);
    // Gérer les erreurs de calcul (ex: division par zéro)
    if (result === "Error") {
      currentInput = "Error";
      firstOperand = null;
      operator = null;
      waitingForSecondOperand = true;
      updateDisplay(); // Important pour afficher l'erreur immédiatement
      return; // Arrêter le traitement
    }
    currentInput = result.toString(); // Afficher le résultat intermédiaire
    firstOperand = result; // Le résultat devient le nouveau premier opérande
  }

  waitingForSecondOperand = true; // Attendre le second opérande pour le nouvel opérateur
  operator = nextOperator; // Stocker le nouvel opérateur
}

/**
 * Gère le clic sur le bouton '='
 * Fonction principale pour effectuer le calcul lorsqu'un utilisateur
 * clique sur '='. Elle prend en compte :
 * - l'absence de premier opérande ou d'opérateur
 * - l'état 'Error'
 * - la conversion des valeurs affichées en nombres
 * - la gestion des erreurs (division par zéro)
 * - la mise à jour de currentInput avec limitation à 9 caractères
 * - la mise à jour des états de la calculatrice
 */
function handleEqualInput() {
  // Si pas de premier opérande ou pas d'opérateur, on ne fait rien
  if (firstOperand === null || operator === null) {
    return;
  }

  if (currentInput === "Error") {
    resetState();
    return;
  }

  const secondOperand = parseFloat(currentInput); // Le nombre actuellement affiché est le second opérande

  // Effectuer l'opération
  const result = performCalculation(firstOperand, secondOperand, operator);

  // Gérer les erreurs (ex: division par zéro)
  if (result === "Error") {
    resetState();
    currentInput = "Error";
    waitingForSecondOperand = true; // Le prochain chiffre remplacera l'affichage
    return;
  }

  currentInput = limitTo9Characters(result);
  firstOperand = null; // Réinitialiser firstOperand
  waitingForSecondOperand = true; // Le prochain chiffre remplacera le résultat
}

/**
 * Réinitialise l'état interne de la calculatrice
 * Met à zéro ou null toutes les variables importantes :
 * - currentInput : affichage courant
 * - firstOperand : premier opérande
 * - operator : opérateur actif
 * - waitingForSecondOperand : indique si on attend le second opérande
 */
function resetState() {
  currentInput = "0";
  firstOperand = null;
  operator = null;
  waitingForSecondOperand = false;
}

// --- Calculs ---
/**
 * Effectue un calcul arithmétique entre deux nombres selon l'opérateur.
 * @param {number} num1 - Premier opérande.
 * @param {number} num2 - Second opérande.
 * @param {string} operator - Opérateur : '+', '-', '*', '/'.
 * @returns {number|string} Résultat du calcul ou 'Error' si division par zéro.
 */
function performCalculation(num1, num2, operator) {
  if (!Number.isFinite(num1) || !Number.isFinite(num2)) {
    return "Error";
  }

  let result;

  switch (operator) {
    case "+":
      result = num1 + num2;
      break;
    case "-":
      result = num1 - num2;
      break;
    case "*":
      result = num1 * num2;
      break;
    case "/":
      result = num2 !== 0 ? num1 / num2 : "Error";
      break;
    default:
      result = "Error";
      break;
  }

  return result;
}

/**
 * Calcule la valeur d'un pourcentage relatif.
 *
 * Exemple : calculatePercent(200, 10) → 20
 *  - base : valeur de référence (ex. 200)
 *  - value : pourcentage à appliquer (ex. 10)
 *
 * @param {number} base - La valeur de base sur laquelle calculer le pourcentage.
 * @param {number} value - Le pourcentage à appliquer.
 * @returns {number} La valeur correspondant au pourcentage de la base.
 */
function calculatePercent(base, value) {
  return (base / 100) * value;
}

// --- Actions spéciales ---
/**
 * Gère les actions spéciales de la calculatrice en fonction de la touche pressée.
 * 
 * @param {string} keyValue - La touche représentant l'action spéciale à effectuer. Valeurs possibles :
 *   - "clearAll" : Efface toutes les entrées et réinitialise la calculatrice.
 *   - "clearEntry" : Efface l'entrée actuelle.
 *   - "%" : Traite l'entrée en pourcentage.
 *   - "sqrt" : Calcule la racine carrée de l'entrée actuelle.
 *   - "negate" : Négative l'entrée actuelle (multiplie par -1).
 */
function handleSpecialInput(keyValue) {
  switch (keyValue) {
    case "clearAll":
      clearAll();
      break;
    case "clearEntry":
      clear();
      break;
    case "%":
      handlePercentInput();
      break;
    case "sqrt":
      handleSqrt();
      break;
    case "negate":
      handleNegate();
      break;
  }
}

/**
 * Réinitialise complètement l'état de la calculatrice.
 *
 * Appelle la fonction resetState() pour remettre à zéro :
 * - l'entrée courante,
 * - le premier opérande,
 * - l'opérateur,
 * - et le flag d'attente du second opérande.
 */
function clearAll() {
  // Appelle de la fonction resetState()
  resetState();
  memory = 0;
}

/**
 * Efface uniquement l'entrée courante sans modifier le reste de l'état.
 *
 * Utilisé pour le bouton "C" : permet de recommencer la saisie du nombre
 * sans perdre le calcul ou l'opération en cours.
 */
function clear() {
  currentInput = "0";
}

/**
 * Gère la logique du bouton '%'
 * - Cas avec opérateur : calcul relatif (ex. 200 + 10% = 220)
 * - Cas sans opérateur : convertit en pourcentage (ex. 50% = 0.5)
 */
function handlePercentInput() {
  let percent = 0;
  let firstOp = parseFloat(firstOperand);
  let current = parseFloat(currentInput);

  // Culcul du pourcentage
  if (firstOperand !== null && operator !== null) {
    percent = calculatePercent(firstOp, current);
  }

  //  Application résultat selon l'opérateur
  switch (operator) {
    case "+":
      currentInput = performCalculation(firstOp, percent, operator).toString();
      break;
    case "-":
      currentInput = performCalculation(firstOp, percent, operator).toString();
      break;
    case "*":
      currentInput = percent.toString();
      break;
    case "/":
      if (current !== 0) {
        currentInput = ((firstOp / current) * 100).toString();
      } else {
        currentInput = "Error";
      }
      break;
    default:
      currentInput = (current / 100).toString();
      break;
  }

  // Mise à jour d'état
  firstOperand = null;
  waitingForSecondOperand = true;
}

/**
 * Calcule la racine carrée de l'entrée actuelle.
 * - Si l'entrée est négative, réinitialise la calculatrice et affiche "Error".
 * - Sinon, remplace l'entrée par la racine carrée du nombre.
 * - Limite la longueur de sortie à 9 caractères.
 * - Met à jour le flag `waitingForSecondOperand` pour préparer la prochaine saisie.
 */
function handleSqrt() {
  let value = parseFloat(currentInput);

  if (value < 0) {
    resetState();
    currentInput = "Error"
    waitingForSecondOperand = true;
  }
  else {
    const squareRoot = Math.sqrt(value);
    // Appliquer la limitation à 8 caractères pour le résultat
    currentInput = limitTo9Characters(squareRoot);
    waitingForSecondOperand = true;
  }
}

/**
 * Inverse le signe de l'entrée actuelle de la calculatrice.
 * - Si l'entrée est un nombre valide, multiplie par -1.
 * - Si l'entrée est "Error" ou invalide, ne fait rien.
 * - Met à jour le flag `waitingForSecondOperand` pour continuer la saisie normalement.
 */
function handleNegate() {
  const value = parseFloat(currentInput);

  if (!isNaN(value)) {
    const negatedValue = value * -1;
    currentInput = negatedValue.toString();
    waitingForSecondOperand = true;
  }
}

// --- Actions Mémoire ---
/**
 * Gère les actions liées à la mémoire (M+, M-, RM/CM).
 * 
 * @param {string} keyValue - Type d’action mémoire :
 *   - "memoryAdd" : ajoute la valeur courante à la mémoire.
 *   - "memorySubtract" : soustrait la valeur courante à la mémoire.
 *   - "recallClearMemory" : rappelle la valeur mémoire (ou la vide si déjà rappelée).
 */
function handleMemoryInput(keyValue) {
  switch (keyValue) {
    case "memoryAdd":
      handleMemoryAdd();
      break;
    case "memorySubtract":
      handleMemorySubtract();
      break;
    case "recallClearMemory":
      // Premier appui : rappelle la mémoire dans l'affichage
      // Deuxième appui consécutif : efface la mémoire
      // Le flag memoryIsRecall sert à savoir si la dernière action
      // était un rappel pour décider si on doit maintenant effacer.
      if (memoryIsRecalled === true) {
        handleClearMemory();
        memoryIsRecalled = false;
      }
      else {
        handleRecallMemory();
      }
      break;
  }
}

/**
 * Adds the current input value to the memory.
 *
 * Converts the `currentInput` string to a floating-point number.
 * If the value is a valid number, it is added to the `memory` variable.
 * After updating memory, sets `waitingForSecondOperand` to true
 * to indicate that the next input should start a new number.
 */
function handleMemoryAdd() {
  const value = parseFloat(currentInput);

  if (!isNaN(value))
    memory += value;

  waitingForSecondOperand = true;
}

/**
 * Subtracts the current input value from the memory.
 *
 * Converts the `currentInput` string to a floating-point number.
 * If the value is a valid number, it is subtracted from the `memory` variable.
 * After updating memory, sets `waitingForSecondOperand` to true
 * to indicate that the next input should start a new number.
 */
function handleMemorySubtract() {
  const value = parseFloat(currentInput);

  if (!isNaN(value))
    memory -= value;

  waitingForSecondOperand = true;
}

/**
 * Recalls the value stored in memory and sets it as the current input.
 *
 * The `memory` value is converted to a string and displayed on the calculator's screen.
 * Sets the `waitingForSecondOperand` flag to true to indicate that a new operation
 * or number input is expected next.
 * 
 * Marks the `memoryIsRecalled` flag as true, so the next press of "recallClearMemory"
 * will trigger the clearing of memory.
 */
function handleRecallMemory() {
  currentInput = memory.toString();
  waitingForSecondOperand = true;
  memoryIsRecalled = true;
}

/**
 * Clears the memory and resets the display to 0.
 *
 * This function resets the `memory` variable to 0 and sets `currentInput` to 0,
 * which updates the display to show "0". It also sets the `waitingForSecondOperand`
 * flag to true, indicating that a new operand is expected. The `memoryIsRecalled` flag
 * is set to false, ensuring that the next "recallClearMemory" action will recall memory
 * instead of clearing it.
 */
function handleClearMemory() {
  memory = 0;
  currentInput = 0; // Afficher 0 dans le display
  waitingForSecondOperand = true;
  memoryIsRecalled = false;
}

/**
 * Resets the `memoryIsRecalled` flag if the button clicked is not "recallClearMemory".
 *
 * This function is called after each button press to ensure that the `memoryIsRecalled` flag
 * is reset to `false` unless the action is specifically "memory" and the key is "recallClearMemory".
 * This is to prevent the flag from remaining true after a memory recall action, so that subsequent
 * memory actions (like M+ or M-) will reset the state properly.
 *
 * @param {string} action - The type of action for the button clicked (e.g., "number", "operator", "memory").
 * @param {string} keyValue - The specific key value of the button clicked (e.g., "1", "2", "+", "recallClearMemory").
 */
function resetMemoryRecallFlag(action, keyValue) {
  // Tout bouton autre que RM/CM réinitialise le flag
  if (!(action === "memory" && keyValue === "recallClearMemory")) {
    memoryIsRecalled = false;
  }
}

/**
 * Fonction développée par ChatGPT (modèle de langage d'OpenAI),
 * qui permet de limiter une valeur numérique à 9 caractères au total 
 * (en prenant en compte la partie entière et décimale). 
 * 
 * Cette fonction effectue plusieurs vérifications :
 * - Si la valeur dépasse 8 caractères dans la partie entière, elle retourne "Error".
 * - Si la valeur contient une partie décimale, elle arrondit le résultat 
 *   en limitant la longueur totale à 8 caractères, y compris la virgule.
 * - Si la partie entière est inférieure ou égale à 8 caractères, la fonction 
 *   conserve la valeur entière et l'arrondie si nécessaire.
 * 
 * Ce code a été intégré dans la calculatrice pour respecter la limite des 
 * caractères d'affichage tout en permettant des calculs précis et fiables.
 */
function limitTo9Characters(value) {
  // Vérifier si la valeur est un nombre valide
  if (isNaN(value)) return "Error";

  // Convertir la valeur en chaîne
  let strValue = value.toString();

  // Si la partie entière dépasse 8 caractères, afficher "Error"
  let integerPartLength = strValue.includes('.') ? strValue.split('.')[0].length : strValue.length;
  
  if (integerPartLength > 8) {
    return "Error";
  }

  // Si la valeur dépasse 8 caractères (avant et après la virgule), on arrondit
  let decimalIndex = strValue.indexOf('.');
  if (decimalIndex !== -1) {
    let integerLength = decimalIndex;
    let maxDecimalLength = 8 - integerLength - 1; // 8 caractères max incluant la virgule

    // Arrondir la partie décimale à ce nombre de décimales
    strValue = parseFloat(value).toFixed(maxDecimalLength);
  } else {
    // Si pas de virgule (entier), on limite la longueur à 8 caractères
    strValue = strValue.slice(0, 8);
  }

  return strValue;
}
