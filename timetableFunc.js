// Get all necessary elements
const timetable = document.getElementById('default-timetable');
const contextMenu = document.getElementById('context-menu');
const joinOption = document.getElementById('join-opt');
const resetButton = document.getElementById('resetBtn');
const printButton = document.getElementById('printBtn');
const saveButton = document.getElementById('saveButton');
const loadButton = document.getElementById('loadButton');
const loadFileInput = document.getElementById('loadFileInput');

// Store the initial timetable HTML
const originalTimetableHTML = timetable.outerHTML;

let combinedTimetableData = {};

// Redo and undo variables
let history = [];
let historyIndex = -1;
let shouldSaveState = false;

function loadInitialState() {
    try {
        const savedData = localStorage.getItem('savedTimetableData');
        
        if (savedData) {
            // Parse the JSON string back into a JavaScript object array
            const data = JSON.parse(savedData);
            
            // Populate the global data object
            data.forEach(item => {
                const key = `${item.row}-${item.col}`;
                combinedTimetableData[key] = item;
            });

            // Rebuild the timetable with the saved data
            rebuildFromData(data);
            
            console.log("Timetable loaded from Local Storage.");
        } else {
            console.log("No saved data found in Local Storage.");
            initializeCombinedDataFromDOM();
        }

        saveState();

    } catch (e) {
        console.error("Error loading data from Local Storage:", e);
        // Clear corrupt data to allow a clean start
        localStorage.removeItem('savedTimetableData');
    }
}

function initializeCombinedDataFromDOM() {
    // Clear any existing data
    combinedTimetableData = {}; 

    const scheduleEntries = document.querySelectorAll('.schedule-entry');
    scheduleEntries.forEach(entry => {
        const row = entry.getAttribute('data-row');
        const col = entry.getAttribute('data-col');
        
        // Get span from style (if joined) or default to 1
        const spanMatch = entry.style.gridColumnEnd.match(/span\s+(\d+)/);
        const span = spanMatch ? parseInt(spanMatch[1]) : 1;
        
        const key = `${row}-${col}`;

        // Only process visible entries, not those hidden by a previous span
        if (entry.style.display !== 'none') {
            combinedTimetableData[key] = {
                row: row, 
                col: col, 
                // Use innerText for content if data-content isn't set yet
                content: entry.getAttribute('data-content') || entry.innerText.trim(), 
                span: span
            };
        }
    });
}

document.getElementById('help').addEventListener('click', function(){
    window.open('Timetable Creator Documentation.html', '_blank');
});

/**
 * Updates classes on a single schedule entry based on its content.
 * @param {HTMLElement} entry - The schedule entry element to update.
 */
function updateEntryClasses(entry) {
    const textContent = entry.innerText.trim();
    // Use the count of '&&' to determine if there's a clash
    const clashCount = (textContent.match(/&&/g) || []).length;
    
    if (clashCount >= 1) {
        entry.classList.add('clash');
        entry.classList.remove('has-content');
    } else if (textContent.length > 0) {
        entry.classList.add('has-content');
        entry.classList.remove('clash');
    } else {
        entry.classList.remove('has-content', 'clash');
    }
}

/**
 * Updates classes on ALL schedule entries.
 */
function updateAllEntries() {
    const allEntries = document.querySelectorAll('.schedule-entry');
    allEntries.forEach(entry => updateEntryClasses(entry));
}


/**
 * Rebuilds the timetable with data from an external source.
 * @param {Array<Object>} data - The array of timetable data objects.
 */
function rebuildFromData(data) {
    const allEntries = document.querySelectorAll('.schedule-entry');
    
    allEntries.forEach(entry => {
        entry.innerHTML = '';
        entry.className = 'schedule-entry';
        entry.style.gridColumnEnd = ''; 
        entry.style.display = ''; 
        entry.removeAttribute('data-content');

        entry.style.direction = 'ltr';
    });

    data.forEach(item => {
        const targetEntry = document.querySelector(`.schedule-entry[data-row='${item.row}'][data-col='${item.col}']`);
        
        if (targetEntry) {
            // Keep the '&&' symbol in the content by storing it in a data attribute
            targetEntry.setAttribute('data-content', item.content);
            
            // Format the content for visual display with line breaks
            const formattedContent = item.content.replace(/&&/g, '<br>&&<br>');
            targetEntry.innerHTML = formattedContent;
            
            // Apply the span from the loaded data
            const span = parseInt(item.span) || 1;
            targetEntry.style.gridColumnEnd = `span ${span}`;
            
            // Hide the divs that are part of the span to prevent them from being displaced
            if (span > 1) {
                // Find the index of the current div
                const currentIndex = Array.from(allEntries).indexOf(targetEntry);
                
                // Hide the subsequent divs that are now occupied
                for (let i = 1; i < span; i++) {
                    const subsequentDiv = allEntries[currentIndex + i];
                    if (subsequentDiv) {
                        subsequentDiv.style.display = 'none';
                    }
                }
            }
            
            updateEntryClasses(targetEntry);
        }
    });

    try {
        localStorage.setItem('savedTimetableData', JSON.stringify(data));
    } catch (e) {
        console.error("Could not save to Local Storage:", e);
    }
}

/**
 * Saves the timetable content to an XML file.
 */
function saveToXML() {
    let xmlStr = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xmlStr += '<timetable>\n';

    const scheduleEntries = document.querySelectorAll('.schedule-entry');
    scheduleEntries.forEach(entry => {
        const row = entry.getAttribute('data-row');
        const col = entry.getAttribute('data-col');
        // Use innerText to get the raw content, preserving '&&'
        const content = entry.innerText.trim();
        const span = entry.style.gridColumnEnd.split(' ')[1] || '1';

        const encodedContent = content
            .replace(/&/g, '&amp;') 
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        // const encodedContent = content.replace(/</g, '&lt;').replace(/>/g, '&gt;');

        xmlStr += `  <entry row="${row}" col="${col}" span="${span}">\n`;
        xmlStr += `    <content>${encodedContent}</content>\n`;
        xmlStr += `  </entry>\n`;
    });

    xmlStr += '</timetable>';

    const blob = new Blob([xmlStr], { type: 'text/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'timetable.xml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Save timetable at a point in time
function saveState()
{
    if (!shouldSaveState) {
        // If the flag is false, don't save and just exit the function.
        return; 
    }

    if (historyIndex < history.length - 1)
    {
        history = history.slice(0, historyIndex + 1);
    }

    history.push(JSON.parse(JSON.stringify(combinedTimetableData)));
    historyIndex++;
    shouldSaveState = false;

    // Log the state of the history array for debugging
    console.log("State saved. History length:", history.length, "Index:", historyIndex);
}

// --- Event Listeners ---

function setupEventListeners() {
    const currentTimetable = document.getElementById('default-timetable');
    
    document.addEventListener('DOMContentLoaded', () => {
        const themeButtons = document.querySelectorAll('.theme-color button');
        const body = document.body;

        // Set the dark theme as the default
        body.classList.add('dark-theme');

        themeButtons.forEach(button => {
            button.addEventListener('click', () => {
                const theme = button.getAttribute('data-theme');

                // Remove active class from all buttons
                themeButtons.forEach(btn => btn.classList.remove('active'));

                // Add active class to the clicked button
                button.classList.add('active');

                // Remove all existing theme classes from body
                body.classList.remove('light-theme', 'dark-theme', 'custom-theme');

                // Add the new theme class
                if (theme) {
                    body.classList.add(`${theme}-theme`);
                }
            });
        });
        
        // Highlight the default button on page load
        const defaultButton = document.querySelector('[data-theme="dark"]');
        if (defaultButton) {
            defaultButton.classList.add('active');
        }
    });

    currentTimetable.addEventListener('focusout', (event) => {
      
        const entry = event.target.closest('.schedule-entry');
        // Only update the data model if the element losing focus is an editable entry
        if (entry) {
            // Get the current row/col from the DOM element
            const row = entry.getAttribute('data-row');
            const col = entry.getAttribute('data-col');
            const key = `${row}-${col}`;
            
            const originalContent = entry.getAttribute('data-content') || '';
            const newContent = entry.innerText.trim();

            // Update the content in the central data structure
            if (newContent !== originalContent)
            {
                entry.setAttribute('data-content', newContent);

                if (combinedTimetableData[key]) {
                    combinedTimetableData[key].content = newContent;
                } else {
                    // This case should ideally not happen but is a good safeguard
                    combinedTimetableData[key] = {
                        row: row,
                        col: col,
                        content: newContent,
                        span: parseInt(entry.style.gridColumnEnd.match(/span\s+(\d+)/)?.[1] || 1)
                    };
                }

                shouldSaveState = true;
                saveState();

                console.log("Data for cell", key, "updated in model.");
            }
            // We do NOT call rebuildFromData() here.
            // Instead, we let the `input` and `click` listeners handle the UI changes.
        }
    });

    currentTimetable.addEventListener('click', (event) => {
        const entry = event.target.closest('.schedule-entry');
        if (!entry) return;
        entry.focus();
        if (event.metaKey || event.ctrlKey) {
            entry.classList.toggle('selected');
        } else {
            document.querySelectorAll('.schedule-entry').forEach(e => e.classList.remove('selected'));
            entry.classList.add('selected');
        }
    });

    currentTimetable.addEventListener('input', (event) => {
        const entry = event.target.closest('.schedule-entry');
        if (!entry) return;

        // Get current DOM data
        const row = entry.getAttribute('data-row');
        const col = entry.getAttribute('data-col');
        const key = `${row}-${col}`;
        const newContent = entry.innerText.trim();

        if (!combinedTimetableData[key]) {
            // Initialize if the cell is new
            combinedTimetableData[key] = {
                row: row, 
                col: col, 
                content: newContent, 
                span: parseInt(entry.style.gridColumnEnd.match(/span\s+(\d+)/)?.[1] || 1)
            };
        }
        // Update the content in the central data structure
        combinedTimetableData[key].content = newContent;
        entry.setAttribute('data-content', newContent);
        
        updateEntryClasses(entry);

        // Font size scaling logic 
        const maxFontSize = 8;
        const minFontSize = 4.2;
        const currentFontSize = parseFloat(window.getComputedStyle(entry).fontSize);

        if (entry.scrollHeight > entry.clientHeight) {
            if (currentFontSize > minFontSize) {
                entry.style.fontSize = `${currentFontSize - 1}px`;
            }
        } else if (entry.scrollHeight <= entry.clientHeight) {
            if (currentFontSize < maxFontSize) {
                entry.style.fontSize = `${currentFontSize + 1}px`;
            }
        }

    });

    currentTimetable.addEventListener('keydown', (event) => {
        const entry = event.target.closest('.schedule-entry');
        if (!entry) return;

        if (event.key === 'Enter') {
            event.preventDefault(); 
            const selection = window.getSelection();
            const range = selection.getRangeAt(0);
            const br = document.createElement('br');
            range.insertNode(br);
            range.setStartAfter(br);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
        }
    });

    currentTimetable.addEventListener('contextmenu', (event) => {
        const entry = event.target.closest('.schedule-entry');
        if (!entry) {
            contextMenu.style.display = 'none';
            return;
        }

        event.preventDefault();

        event.preventDefault();
        const selected = document.querySelectorAll('.schedule-entry.selected');
        if (selected.length >= 2) {
            contextMenu.style.display = 'block';
            contextMenu.style.left = `${event.clientX}px`;
            contextMenu.style.top = `${event.pageY - 240}px`;

            console.log("Mouse Pos : " + event.clientX + ", " + event.clientY);
        } else {
            contextMenu.style.display = 'none';
        }
    });

    document.addEventListener('click', (event) => {
        if (!contextMenu.contains(event.target)) {
            contextMenu.style.display = 'none';
        }
    });

    joinOption.addEventListener('click', () => {
        const selected = Array.from(document.querySelectorAll('.schedule-entry.selected'));
        
        if (selected.length < 2) {
            alert('Please select at least two schedule entries to join.');
            return;
        }

        if (Object.keys(combinedTimetableData).length === 0) {
            initializeCombinedDataFromDOM();
        }

        selected.sort((a, b) => {
            const aRow = parseInt(a.getAttribute('data-row'));
            const aCol = parseInt(a.getAttribute('data-col'));
            const bRow = parseInt(b.getAttribute('data-row'));
            const bCol = parseInt(b.getAttribute('data-col'));
            return (aRow - bRow) || (aCol - bCol);
        });

        const primaryElement = selected[0];
        const primaryKey = primaryElement.getAttribute('data-row') + "-" + primaryElement.getAttribute('data-col');
        let primaryData = combinedTimetableData[primaryKey];

        if (!primaryData)
        {
            initializeCombinedDataFromDOM();
            primaryData = combinedTimetableData[primaryKey];
            if (!primaryData) return alert('Error initializing primary cell data');
        }

        const firstRow = parseInt(primaryElement.getAttribute('data-row'));
        for (let i = 0; i < selected.length - 1; i++)
        {
            const currentElement = selected[i];
            const nextElement = selected[i + 1];

            const currentRow = parseInt(currentElement.getAttribute('data-row'));
            const currentCol = parseInt(currentElement.getAttribute('data-col'));
            const nextRow = parseInt(nextElement.getAttribute('data-row'));
            const nextCol = parseInt(nextElement.getAttribute('data-col'));

            const currentKey = `${currentRow}-${currentCol}`;
            const currentSpan = parseInt(combinedTimetableData[currentKey]?.span) || 1;

            if (currentRow != firstRow || currentRow !== nextRow || nextCol !== currentCol + currentSpan)
            {
                alert('Selected items are not all horizontally adjacent, or are in different rows, or a gap exists between them.');
                return;
            }
        }

        let totalSpanToAdd = 0;
        let primaryContent = primaryData.content.trim();

        for (let i = 1; i < selected.length; i++)
        {
            const secondaryElement = selected[i];
            const secondaryKey = secondaryElement.getAttribute('data-row') + '-' + secondaryElement.getAttribute('data-col');
            const secondaryData = combinedTimetableData[secondaryKey];

            if (secondaryData)
            {
                if (secondaryData.content.trim() !== '')
                {
                    const currentModules = primaryContent.split('&&').map(m => m.trim()).filter(m => m.length > 0);
                    if (currentModules.length < 2)
                    {
                        primaryContent += (primaryContent ? '&&' : '') + secondaryData.content.trim();
                    }
                }

                totalSpanToAdd += parseInt(secondaryData.span) || 1;

                delete combinedTimetableData[secondaryKey];
            }
        }

        primaryData.content = primaryContent;
        primaryData.span = (parseInt(primaryData.span) || 1) + totalSpanToAdd;

        selected.forEach(e => e.classList.remove('selected'));
        contextMenu.style.display = 'none';

        // Debug line
        console.log("Divs have been joined");

        rebuildFromData(Object.values(combinedTimetableData));
        shouldSaveState = true;
        saveState();
    });
}

// --- Initial Setup & Button Listeners ---

setupEventListeners();

loadInitialState();

document.addEventListener('keydown', (event) => {
    // Ctrl+z (undo) function
    if (event.ctrlKey || event.metaKey)
    {
        if (event.key === 'z' || event.key === 'Z')
        {
            event.preventDefault();
            if (historyIndex > 0)
            {
                historyIndex--;
                combinedTimetableData = history[historyIndex];
                rebuildFromData(Object.values(combinedTimetableData));
                console.log("Undo performed. Current state at index:", historyIndex);
            }else {
                combinedTimetableData = {};
                rebuildFromData(Object.values(combinedTimetableData));
                initializeCombinedDataFromDOM();
                console.log("Nothing to undo");
            }
        }
    }

    // Ctrl+y (redo) function
    if (event.key === 'y' || event.key === 'Y' || (event.shiftKey && (event.key === 'Z' || event.key === 'z')))
    {
        event.preventDefault();
        if (historyIndex < history.length - 1)
        {
            historyIndex++;
            combinedTimetableData = history[historyIndex];
            rebuildFromData(Object.values(combinedTimetableData));
            console.log("Redo performed. Current state at index:", historyIndex);
        } else {
            console.log("Nothing to redo");
        }
    }
});

if (resetButton) {
    resetButton.addEventListener('click', () => {
        // Clear the persistent data from Local Storage
        localStorage.removeItem('savedTimetableData');

        // Clear the history stacks
        history = [];
        historyIndex = -1; 
        
        // Now reload the page, which will find no saved data and load the original HTML
        location.reload();
    });
}

if (printButton) {
    printButton.addEventListener('click', () => {
        const selectedEntries = document.querySelectorAll('.schedule-entry.selected');
        const originalSelectedState = Array.from(selectedEntries);
        selectedEntries.forEach(entry => entry.classList.remove('selected'));
        window.print();
        window.addEventListener('afterprint', () => {
            originalSelectedState.forEach(entry => entry.classList.add('selected'));
        }, { once: true });
    });
}

if (saveButton) {
    saveButton.addEventListener('click', saveToXML);
}

if (loadButton) {
    loadButton.addEventListener('click', () => loadFileInput.click());
}

if (loadFileInput) {
    loadFileInput.addEventListener('change', (event) => {
        const files = event.target.files;
        if (files.length === 0) return;

        combinedTimetableData = {};
        let filesProcessed = 0;

        for (const file of files) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const xmlString = e.target.result;
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

                if (xmlDoc.getElementsByTagName('parsererror').length > 0) {
                    console.error('Error parsing XML file:', file.name);
                    filesProcessed++;
                    if (filesProcessed === files.length) {
                        rebuildFromData(Object.values(combinedTimetableData));
                        saveState();
                    }
                    return;
                }

                const entries = xmlDoc.getElementsByTagName('entry');
                for (const entry of entries) {
                    const row = entry.getAttribute('row');
                    const col = entry.getAttribute('col');
                    const contentElement = entry.getElementsByTagName('content')[0];
                    const content = contentElement ? contentElement.textContent : '';
                    
                    // Read the span as a number, defaulting to 1
                    const incomingSpan = parseInt(entry.getAttribute('span')) || 1; 
                    const key = `${row}-${col}`;

                    if (combinedTimetableData[key]) {
                        
                        // SPAN MERGE (Keeps the largest span)
                        const existingSpan = parseInt(combinedTimetableData[key].span) || 1;
                        if (incomingSpan > existingSpan) {
                            combinedTimetableData[key].span = incomingSpan;
                        }

                        // CONTENT MERGE (Restored the check for keeping only two modules)
                        if (combinedTimetableData[key].content.trim() !== '' && content.trim() !== '') {
                            const currentModules = combinedTimetableData[key].content.split('&&').map(m => m.trim()).filter(m => m.length > 0);
                            
                            // Check if the current combined content already has 2 modules
                            if (currentModules.length < 2) { 
                                // Only merge if it currently has less than 2 modules
                                // Removed spaces around '&&' as per your earlier instruction
                                combinedTimetableData[key].content += '&&' + content; 
                            }
                        } else if (content.trim() !== '') {
                            // If existing content is empty, but incoming content is not, use incoming
                            combinedTimetableData[key].content = content;
                        }
                        
                    } else {
                        // If it's a new entry, initialize it
                        combinedTimetableData[key] = { row, col, content, span: incomingSpan };
                    }
                }

                filesProcessed++;
                if (filesProcessed === files.length) {
                    rebuildFromData(Object.values(combinedTimetableData));
                }
            };
            reader.readAsText(file);
        }
    });
}
