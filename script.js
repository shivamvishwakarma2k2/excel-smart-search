// Global variables
let data = [];
let headerRow = [];
let filteredRows = [];
let currentPage = 1;
let sortCol = -1;
let sortAsc = true;
let rowsPerPage = 10;
const uniqueWords = new Map();
let lastFileName = "";
let isDarkMode = false;

// Global functions for editing
function editRow(rowIndex) {
    const actualIndex = (currentPage - 1) * rowsPerPage + rowIndex;
    const row = document.querySelector(
        `tr[data-row-index="${rowIndex}"]`
    );
    if (!row) return;

    row.classList.add("edit-mode");
    const cells = row.querySelectorAll("td[data-col]");

    cells.forEach((cell) => {
        const colIndex = parseInt(cell.getAttribute("data-col"));
        cell.setAttribute("contenteditable", "true");
        cell.classList.add("edit-cell");
        cell.setAttribute("data-original", cell.textContent);
    });

    // Add save button to the edit button cell
    const actionCell = row.querySelector("td:first-child");
    actionCell.innerHTML = `
        <div class="flex space-x-2 min-w-[100px]">
            <button class="action-btn edit-btn" onclick="editRow(${rowIndex})">
                <i class="fas fa-edit"></i>
            </button>
            <button class="action-btn save-btn" onclick="saveRow(${rowIndex})">
                <i class="fas fa-save"></i>
            </button>
            <button class="action-btn delete-btn" onclick="deleteRow(${rowIndex})">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
}

function saveRow(rowIndex) {
    const actualIndex = (currentPage - 1) * rowsPerPage + rowIndex;
    const row = document.querySelector(
        `tr[data-row-index="${rowIndex}"]`
    );
    if (!row) return;

    const cells = row.querySelectorAll("td[data-col]");
    cells.forEach((cell) => {
        const colIndex = parseInt(cell.getAttribute("data-col"));
        const newValue = cell.textContent;
        saveCellEdit(actualIndex, colIndex, newValue);
        cell.setAttribute("contenteditable", "false");
        cell.classList.remove("edit-cell");
    });

    row.classList.remove("edit-mode");

    // Restore original buttons
    const actionCell = row.querySelector("td:first-child");
    actionCell.innerHTML = `
        <div class="flex space-x-2 min-w-[100px]">
            <button class="action-btn edit-btn" onclick="editRow(${rowIndex})">
                <i class="fas fa-edit"></i>
            </button>
            <button class="action-btn delete-btn" onclick="deleteRow(${rowIndex})">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;

    showToast("Row updated successfully", "success");
}

function toggleGlobalEdit() {
    const resultTable = document.getElementById("resultTable");
    const isEditMode = resultTable.classList.toggle("edit-mode");
    const cells = resultTable.querySelectorAll("td[data-col]");

    cells.forEach((cell) => {
        cell.setAttribute("contenteditable", isEditMode);
        if (isEditMode) {
            cell.classList.add("edit-cell");
            cell.setAttribute("data-original", cell.textContent);
        } else {
            cell.classList.remove("edit-cell");
            if (
                cell.hasAttribute("data-original") &&
                cell.textContent !==
                cell.getAttribute("data-original")
            ) {
                const rowIndex = parseInt(
                    cell.parentElement.getAttribute(
                        "data-row-index"
                    )
                );
                const colIndex = parseInt(
                    cell.getAttribute("data-col")
                );
                const actualIndex =
                    (currentPage - 1) * rowsPerPage + rowIndex;
                saveCellEdit(
                    actualIndex,
                    colIndex,
                    cell.textContent
                );
            }
        }
    });

    // Update global edit button
    const globalEditBtn =
        document.querySelector(".global-edit-btn");
    if (globalEditBtn) {
        globalEditBtn.innerHTML = isEditMode
            ? '<i class="fas fa-save"></i>'
            : '<i class="fas fa-edit"></i>';
    }

    showToast(
        isEditMode
            ? "Global edit mode enabled"
            : "Global edit mode disabled",
        "info"
    );
}

function saveCellEdit(rowIndex, colIndex, newValue) {
    data[rowIndex][colIndex] = newValue;
    showToast("Cell updated successfully", "success");
}

function deleteRow(rowIndex) {
    const actualIndex = (currentPage - 1) * rowsPerPage + rowIndex;
    if (confirm("Are you sure you want to delete this row?")) {
        // Remove the row from the table immediately
        const row = document.querySelector(
            `tr[data-row-index="${rowIndex}"]`
        );
        if (row) {
            row.remove();
        }

        // Update the data
        data.splice(actualIndex, 1);
        const term = document
            .getElementById("searchInput")
            .value.trim();
        if (!term) filteredRows = [...data];
        else searchAndRender();

        // Update pagination and counts
        rowsPerPage = filteredRows.length;
        currentPage = 1;

        // Update the result count immediately
        resultCount.innerHTML = `<strong>${filteredRows.length
            }</strong> ${filteredRows.length === 1 ? "row" : "rows"
            } matched ${data.length ? `(from ${data.length} total)` : ""
            }`;

        renderTable();
        showToast("Row deleted successfully", "success");
    }
}

function showAddRowForm() {
    document.getElementById("rowsPerPage").value = "all";
    rowsPerPage = filteredRows.length;
    currentPage = 1;
    renderTable();
    const form = document.createElement("div");
    form.className =
        "new-row-form p-4 bg-gray-50 border rounded mb-4";
    const gridClassName = "grid grid-cols-1 md:grid-cols-3 gap-4";
    form.innerHTML = `<div class="${gridClassName}">`;
    headerRow.forEach((col, index) => {
        const inputGroup = document.createElement("div");
        inputGroup.className = "mb-3";
        inputGroup.innerHTML = `<label class="block text-sm font-medium text-gray-700 mb-1">${col}</label><input type="text" class="form-input w-full rounded border px-3 py-2" data-col="${index}" placeholder="${col}">`;
        form.appendChild(inputGroup);
    });
    const buttonGroup = document.createElement("div");
    buttonGroup.className = "flex justify-end mt-4 space-x-2";
    const cancelButton = document.createElement("button");
    cancelButton.className =
        "px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300";
    cancelButton.textContent = "Cancel";
    cancelButton.onclick = () => form.remove();
    const addButton = document.createElement("button");
    addButton.className =
        "px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700";
    addButton.innerHTML =
        '<i class="fas fa-check mr-1"></i> Add Row';
    addButton.onclick = () => {
        const newRow = [];
        let isValid = true;
        form.querySelectorAll("input[data-col]").forEach((input) =>
            newRow.push(input.value)
        );
        if (isValid) {
            data.push(newRow);
            filteredRows.push(newRow);
            form.remove();
            rowsPerPage = filteredRows.length;
            currentPage = 1;
            renderTable();
            showToast("New row added successfully", "success");
        }
    };
    buttonGroup.appendChild(cancelButton);
    buttonGroup.appendChild(addButton);
    form.appendChild(buttonGroup);
    const resultsContainer =
        document.getElementById("resultsContainer");
    resultsContainer.insertBefore(
        form,
        document.getElementById("resultTable")
    );
}

function showToast(message, type = "info") {
    // Remove existing toast if any
    const existingToast = document.querySelector(
        ".toast-notification"
    );
    if (existingToast) {
        existingToast.remove();
    }

    // Create new toast
    const toast = document.createElement("div");
    toast.className =
        "toast-notification fixed bottom-4 right-4 z-50 p-4 rounded-lg shadow-lg slide-up max-w-sm";

    // Set color based on type
    switch (type) {
        case "success":
            toast.classList.add("bg-green-600", "text-white");
            toast.innerHTML = `<div class="flex items-center"><i class="fas fa-check-circle mr-2"></i>${message}</div>`;
            break;
        case "error":
            toast.classList.add("bg-red-600", "text-white");
            toast.innerHTML = `<div class="flex items-center"><i class="fas fa-exclamation-circle mr-2"></i>${message}</div>`;
            break;
        case "warning":
            toast.classList.add("bg-yellow-500", "text-white");
            toast.innerHTML = `<div class="flex items-center"><i class="fas fa-exclamation-triangle mr-2"></i>${message}</div>`;
            break;
        default:
            toast.classList.add("bg-indigo-600", "text-white");
            toast.innerHTML = `<div class="flex items-center"><i class="fas fa-info-circle mr-2"></i>${message}</div>`;
    }

    document.body.appendChild(toast);

    // Remove toast after 3 seconds
    setTimeout(() => {
        toast.classList.add("fade-out");
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

document.addEventListener("DOMContentLoaded", () => {
    // DOM Elements
    const fileInput = document.getElementById("fileInput");
    const fileInfo = document.getElementById("fileInfo");
    const searchInput = document.getElementById("searchInput");
    const suggestionsBox = document.getElementById("suggestions");
    const resultTable = document.getElementById("resultTable");
    const resultCount = document.getElementById("resultCount");
    const columnSelect = document.getElementById("columnSelect");
    const caseToggle = document.getElementById("caseToggle");
    const pagination = document.getElementById("pagination");
    const downloadBtn = document.getElementById("downloadBtn");
    const fileUploadContainer = document.getElementById(
        "fileUploadContainer"
    );
    const searchContainer =
        document.getElementById("searchContainer");
    const resultsContainer =
        document.getElementById("resultsContainer");
    const noDataContainer =
        document.getElementById("noDataContainer");
    const loadingContainer =
        document.getElementById("loadingContainer");
    const rowsPerPageSelect =
        document.getElementById("rowsPerPage");
    const themeToggle = document.getElementById("themeToggle");
    const helpBtn = document.getElementById("helpBtn");
    const helpModal = document.getElementById("helpModal");
    const closeHelpBtn = document.getElementById("closeHelpBtn");
    const gotItBtn = document.getElementById("gotItBtn");
    const fileDropArea = document.querySelector(".file-drop-area");
    const resetBtn = document.getElementById("resetBtn");

    // Initialize UI state
    function initializeUI() {
        data = [];
        headerRow = [];
        filteredRows = [];
        currentPage = 1;
        sortCol = -1;
        sortAsc = true;
        rowsPerPage = 10;
        uniqueWords.clear();
        lastFileName = "";

        // Reset UI elements
        resultTable.innerHTML = "";
        resultCount.textContent = "";
        searchInput.value = "";
        columnSelect.innerHTML =
            '<option value="all">All Columns</option>';
        fileInfo.innerHTML = "";

        // Reset UI state
        fileUploadContainer.classList.remove("hidden");
        searchContainer.classList.add("hidden");
        resultsContainer.classList.add("hidden");
        noDataContainer.classList.remove("hidden");
        resetBtn.classList.add("hidden");
    }

    // Call initializeUI on page load
    initializeUI();

    // Event Listeners
    fileInput.addEventListener("change", handleFile);
    searchInput.addEventListener(
        "input",
        debounce(() => {
            currentPage = 1;
            showSuggestions(searchInput.value);
            searchAndRender();
        }, 300)
    );
    columnSelect.addEventListener("change", searchAndRender);
    caseToggle.addEventListener("change", searchAndRender);
    downloadBtn.addEventListener("click", downloadCSV);
    rowsPerPageSelect.addEventListener("change", () => {
        const value = rowsPerPageSelect.value;
        if (value === "all") rowsPerPage = filteredRows.length;
        else rowsPerPage = parseInt(value);
        currentPage = 1;
        renderTable();
    });
    themeToggle.addEventListener("click", toggleTheme);
    helpBtn.addEventListener("click", () =>
        helpModal.classList.remove("hidden")
    );
    closeHelpBtn.addEventListener("click", () =>
        helpModal.classList.add("hidden")
    );
    gotItBtn.addEventListener("click", () =>
        helpModal.classList.add("hidden")
    );
    resetBtn.addEventListener("click", resetData);

    // File drag and drop
    fileDropArea.addEventListener("dragover", (e) => {
        e.preventDefault();
        fileDropArea.classList.add("active");
    });

    fileDropArea.addEventListener("dragleave", () => {
        fileDropArea.classList.remove("active");
    });

    fileDropArea.addEventListener("drop", (e) => {
        e.preventDefault();
        fileDropArea.classList.remove("active");

        if (e.dataTransfer.files.length) {
            fileInput.files = e.dataTransfer.files;
            handleFile({ target: { files: e.dataTransfer.files } });
        }
    });

    // Add keyboard navigation for suggestions
    let currentSuggestionIndex = -1;
    searchInput.addEventListener("keydown", (e) => {
        const suggestions = suggestionsBox.querySelectorAll("li");
        if (!suggestions.length) return;

        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                currentSuggestionIndex = Math.min(
                    currentSuggestionIndex + 1,
                    suggestions.length - 1
                );
                updateSuggestionSelection(suggestions);
                break;
            case "ArrowUp":
                e.preventDefault();
                currentSuggestionIndex = Math.max(
                    currentSuggestionIndex - 1,
                    -1
                );
                updateSuggestionSelection(suggestions);
                break;
            case "Enter":
                e.preventDefault();
                if (currentSuggestionIndex >= 0) {
                    searchInput.value =
                        suggestions[
                            currentSuggestionIndex
                        ].textContent;
                    suggestionsBox.classList.remove("show");
                    searchAndRender();
                }
                break;
            case "Escape":
                suggestionsBox.classList.remove("show");
                currentSuggestionIndex = -1;
                break;
        }
    });

    function updateSuggestionSelection(suggestions) {
        suggestions.forEach((suggestion, index) => {
            suggestion.classList.toggle(
                "bg-indigo-100",
                index === currentSuggestionIndex
            );
        });
    }

    // Click outside suggestions to close
    document.addEventListener("click", (e) => {
        if (
            e.target !== searchInput &&
            e.target !== suggestionsBox
        ) {
            suggestionsBox.classList.remove("show");
        }
    });

    // Close modal on click outside
    helpModal.addEventListener("click", (e) => {
        if (e.target === helpModal) {
            helpModal.classList.add("hidden");
        }
    });

    function handleFile(e) {
        console.log("Starting file handling...");
        const file = e.target.files[0];
        if (!file) {
            console.log("No file selected");
            return;
        }

        const ext = file.name.split(".").pop().toLowerCase();
        if (ext !== "csv" && ext !== "xlsx") {
            showToast(
                "Please upload a valid CSV or Excel file.",
                "error"
            );
            return;
        }

        console.log("Processing file:", file.name);
        lastFileName = file.name;
        fileInfo.innerHTML = `<div class="flex items-center"><div class="animate-spin h-4 w-4 border-2 border-indigo-500 rounded-full border-t-transparent mr-2"></div> Processing ${file.name}...</div>`;

        fileUploadContainer.classList.add("hidden");
        loadingContainer.classList.remove("hidden");
        searchContainer.classList.add("hidden");
        resultsContainer.classList.add("hidden");
        noDataContainer.classList.add("hidden");
        resetBtn.classList.add("hidden");

        const reader = new FileReader();

        reader.onload = (ev) => {
            try {
                console.log(
                    "File read successfully, starting parsing..."
                );
                const content = ev.target.result;
                let parsedHeaderRow = [];
                let parsedData = [];

                if (ext === "csv") {
                    console.log("Parsing CSV file...");
                    const parsed = Papa.parse(content, {
                        skipEmptyLines: true,
                        header: false,
                        dynamicTyping: true,
                    });

                    if (!parsed.data || parsed.data.length === 0) {
                        throw new Error(
                            "Empty or invalid CSV file"
                        );
                    }

                    parsedHeaderRow = parsed.data[0];
                    parsedData = parsed.data.slice(1);
                    console.log(
                        "CSV parsed successfully:",
                        parsedHeaderRow.length,
                        "columns,",
                        parsedData.length,
                        "rows"
                    );
                } else {
                    console.log("Parsing Excel file...");
                    const wb = XLSX.read(content, {
                        type: "binary",
                        cellDates: true,
                        cellNF: false,
                        cellText: false,
                    });

                    if (
                        !wb.SheetNames ||
                        wb.SheetNames.length === 0
                    ) {
                        throw new Error(
                            "No sheets found in Excel file"
                        );
                    }

                    const sheet = wb.Sheets[wb.SheetNames[0]];
                    const parsed = XLSX.utils.sheet_to_json(sheet, {
                        header: 1,
                        defval: "",
                    });

                    if (!parsed || parsed.length === 0) {
                        throw new Error(
                            "Empty or invalid Excel sheet"
                        );
                    }

                    parsedHeaderRow = parsed[0];
                    parsedData = parsed.slice(1);
                    console.log(
                        "Excel parsed successfully:",
                        parsedHeaderRow.length,
                        "columns,",
                        parsedData.length,
                        "rows"
                    );
                }

                // Validate the data
                if (
                    !parsedHeaderRow ||
                    parsedHeaderRow.length === 0
                ) {
                    throw new Error("Invalid header row");
                }

                // Clean up the data
                parsedData = parsedData.map((row) => {
                    return row.map((cell) => {
                        if (cell === null || cell === undefined)
                            return "";
                        return cell;
                    });
                });

                console.log("Updating global variables...");
                // Update global variables
                headerRow = parsedHeaderRow;
                data = parsedData;
                filteredRows = [...data];

                console.log("Global variables updated:", {
                    headerRowLength: headerRow.length,
                    dataLength: data.length,
                    filteredRowsLength: filteredRows.length,
                });

                // Complete the loading
                fileInfo.innerHTML = `<span class="text-indigo-600 font-medium"><i class="fas fa-check-circle mr-1"></i> ${file.name}</span>`;
                loadingContainer.classList.add("hidden");
                searchContainer.classList.remove("hidden");
                resultsContainer.classList.remove("hidden");
                resetBtn.classList.remove("hidden");

                // Populate and render
                console.log("Populating column select...");
                populateColumnSelect();
                console.log("Extracting words...");
                extractWords();
                console.log("Rendering table...");
                searchAndRender();
                showToast(
                    `Successfully loaded ${file.name} with ${data.length} rows`,
                    "success"
                );
            } catch (error) {
                console.error("Error parsing file:", error);
                fileUploadContainer.classList.remove("hidden");
                loadingContainer.classList.add("hidden");
                resetBtn.classList.add("hidden");
                showToast(
                    `Failed to process file: ${error.message}`,
                    "error"
                );
            }
        };

        reader.onerror = (error) => {
            console.error("FileReader error:", error);
            fileUploadContainer.classList.remove("hidden");
            loadingContainer.classList.add("hidden");
            resetBtn.classList.add("hidden");
            showToast(
                "Error reading file. Please try again.",
                "error"
            );
        };

        if (ext === "csv") {
            console.log("Reading as text...");
            reader.readAsText(file);
        } else {
            console.log("Reading as binary...");
            reader.readAsBinaryString(file);
        }
    }

    function populateColumnSelect() {
        console.log(
            "Populating column select with headerRow:",
            headerRow
        );
        columnSelect.innerHTML =
            '<option value="all">All Columns</option>';
        headerRow.forEach((col, i) => {
            const opt = document.createElement("option");
            opt.value = i;
            opt.textContent = col;
            columnSelect.appendChild(opt);
        });
    }

    function extractWords() {
        uniqueWords.clear();
        data.flat().forEach((cell) => {
            if (cell && typeof cell === "string") {
                cell.split(/\s+/).forEach((word) => {
                    const w = word.trim().toLowerCase();
                    if (w && w.length > 1)
                        uniqueWords.set(
                            w,
                            (uniqueWords.get(w) || 0) + 1
                        );
                });
            }
        });
    }

    function showSuggestions(input) {
        suggestionsBox.innerHTML = "";
        if (!input || input.length < 2) {
            suggestionsBox.classList.remove("show");
            return;
        }

        const matches = [...uniqueWords.keys()]
            .filter((word) => word.includes(input.toLowerCase()))
            .sort((a, b) => uniqueWords.get(b) - uniqueWords.get(a)) // Sort by frequency
            .slice(0, 8);

        if (matches.length === 0) {
            suggestionsBox.classList.remove("show");
            return;
        }

        matches.forEach((match) => {
            const li = document.createElement("li");
            li.innerHTML = highlightMatch(match, input);
            li.className =
                "p-3 hover:bg-gray-100 cursor-pointer text-gray-700 border-b border-gray-100 last:border-0";
            li.onclick = () => {
                searchInput.value = match;
                suggestionsBox.classList.remove("show");
                searchAndRender();
            };
            suggestionsBox.appendChild(li);
        });

        suggestionsBox.classList.add("show");
    }

    function highlightMatch(text, query) {
        const regex = new RegExp(`(${query})`, "gi");
        return text.replace(
            regex,
            '<span class="font-medium text-indigo-600">$1</span>'
        );
    }

    function searchAndRender() {
        const term = searchInput.value.trim();
        const isCase = caseToggle.checked;
        const col = columnSelect.value;

        const logic = term.includes(",") ? "OR" : "AND";
        const parts =
            logic === "OR"
                ? term.split(",").map((p) => p.trim())
                : term.split(/\s+/);
        // If no search term, show all data
        if (!term) {
            filteredRows = [...data];
        } else {
            filteredRows = data.filter((row) => {
                if (!row || row.length === 0) return false;

                const cells = col === "all" ? row : [row[col]];

                return cells.some((cell) => {
                    if (!cell) return false;
                    const text = isCase
                        ? String(cell)
                        : String(cell).toLowerCase();

                    return logic === "AND"
                        ? parts.every((p) =>
                            text.includes(
                                isCase ? p : p.toLowerCase()
                            )
                        )
                        : parts.some((p) =>
                            text.includes(
                                isCase ? p : p.toLowerCase()
                            )
                        );
                });
            });
        }

        sortAndRenderTable();
    }

    function sortAndRenderTable() {
        if (sortCol >= 0) {
            filteredRows.sort((a, b) => {
                if (!a || !b) return 0;

                const A = a[sortCol]?.toString() || "";
                const B = b[sortCol]?.toString() || "";

                // Try to sort as numbers if possible
                const numA = parseFloat(A);
                const numB = parseFloat(B);

                if (!isNaN(numA) && !isNaN(numB)) {
                    return sortAsc ? numA - numB : numB - numA;
                }

                // Otherwise sort alphabetically
                return sortAsc
                    ? A.localeCompare(B)
                    : B.localeCompare(A);
            });
        }

        renderTable();
    }

    function renderTableHeader() {
        const thead = resultTable.createTHead();
        const headerRowElement = thead.insertRow();

        // Add action column header first
        const actionHeader = document.createElement("th");
        actionHeader.className =
            "px-3 py-2 font-semibold border-b text-left resizable";
        actionHeader.innerHTML = "Actions";
        actionHeader.style.width = "100px";
        headerRowElement.appendChild(actionHeader);

        // Add regular headers
        headerRow.forEach((text, idx) => {
            const th = document.createElement("th");
            th.className =
                "px-3 py-2 font-semibold border-b text-left resizable";
            th.style.width = "150px"; // Default width

            // Create header content container
            const headerContent = document.createElement("div");
            headerContent.className =
                "flex items-center justify-between";

            // Add column title
            const titleSpan = document.createElement("span");
            titleSpan.textContent = text;
            titleSpan.className = "truncate";
            headerContent.appendChild(titleSpan);

            // Add sort icons container
            const sortContainer = document.createElement("div");
            sortContainer.className = "flex flex-col ml-1";

            // Add up arrow
            const upArrow = document.createElement("i");
            upArrow.className = `fas fa-sort-up sort-icon ${sortCol === idx && sortAsc ? "active" : ""
                }`;
            upArrow.onclick = (e) => {
                e.stopPropagation();
                if (sortCol === idx && sortAsc) {
                    sortCol = -1; // Clear sort
                } else {
                    sortCol = idx;
                    sortAsc = true;
                }
                sortAndRenderTable();
            };

            // Add down arrow
            const downArrow = document.createElement("i");
            downArrow.className = `fas fa-sort-down sort-icon ${sortCol === idx && !sortAsc ? "active" : ""
                }`;
            downArrow.onclick = (e) => {
                e.stopPropagation();
                if (sortCol === idx && !sortAsc) {
                    sortCol = -1; // Clear sort
                } else {
                    sortCol = idx;
                    sortAsc = false;
                }
                sortAndRenderTable();
            };

            sortContainer.appendChild(upArrow);
            sortContainer.appendChild(downArrow);
            headerContent.appendChild(sortContainer);
            th.appendChild(headerContent);

            // Add resizer
            const resizer = document.createElement("div");
            resizer.className = "resizer";
            th.appendChild(resizer);

            // Handle resize
            let isResizing = false;
            let startX;
            let startWidth;

            resizer.addEventListener("mousedown", (e) => {
                isResizing = true;
                startX = e.pageX;
                startWidth = th.offsetWidth;
                resizer.classList.add("resizing");
                e.preventDefault();
            });

            document.addEventListener("mousemove", (e) => {
                if (!isResizing) return;

                const width = startWidth + (e.pageX - startX);
                if (width >= 100 && width <= 500) {
                    th.style.width = `${width}px`;
                    // Update all cells in this column
                    const cells = resultTable.querySelectorAll(
                        `td[data-col="${idx}"]`
                    );
                    cells.forEach(
                        (cell) => (cell.style.width = `${width}px`)
                    );
                }
            });

            document.addEventListener("mouseup", () => {
                if (isResizing) {
                    isResizing = false;
                    resizer.classList.remove("resizing");
                }
            });

            headerRowElement.appendChild(th);
        });
    }

    function renderTable() {
        resultTable.innerHTML = "";

        if (headerRow.length === 0 || filteredRows.length === 0) {
            resultCount.textContent =
                data.length > 0
                    ? "No matching records found."
                    : "No data loaded. Please upload a file.";
            return;
        }

        renderTableHeader();

        const tbody = resultTable.createTBody();
        const start = (currentPage - 1) * rowsPerPage;
        const pageRows = filteredRows.slice(
            start,
            start + rowsPerPage
        );

        pageRows.forEach((row, rowIdx) => {
            const tr = tbody.insertRow();
            tr.className =
                rowIdx % 2 === 0 ? "bg-white" : "bg-gray-50";
            tr.setAttribute("data-row-index", rowIdx);

            // Add action buttons cell first
            const actionCell = tr.insertCell();
            actionCell.className = "px-3 py-2 border-b";
            actionCell.style.width = "100px"; // Match header width
            actionCell.innerHTML = `
                <div class="flex space-x-2 min-w-[100px]">
                    <button class="action-btn edit-btn" onclick="editRow(${rowIdx})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" onclick="deleteRow(${rowIdx})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;

            // Add data cells
            row.forEach((cell, cellIdx) => {
                const td = tr.insertCell();
                td.className = "px-3 py-2 border-b text-gray-700";
                td.setAttribute("data-row", rowIdx);
                td.setAttribute("data-col", cellIdx);
                td.setAttribute("contenteditable", "false");

                // Match the width of the corresponding header
                const headerWidth = resultTable.querySelector(
                    `th:nth-child(${cellIdx + 2})`
                ).style.width;
                if (headerWidth) {
                    td.style.width = headerWidth;
                }

                if (cell === null || cell === undefined) {
                    td.textContent = "";
                } else if (typeof cell === "number") {
                    td.className += " text-right font-mono";
                    td.textContent = cell;
                } else if (
                    String(cell).startsWith("http://") ||
                    String(cell).startsWith("https://")
                ) {
                    const a = document.createElement("a");
                    a.href = cell;
                    a.target = "_blank";
                    a.className = "text-indigo-600 hover:underline";
                    a.textContent = cell;
                    td.appendChild(a);
                } else {
                    td.textContent = cell;
                }
            });
        });

        resultCount.innerHTML = `<strong>${filteredRows.length
            }</strong> ${filteredRows.length === 1 ? "row" : "rows"
            } matched ${data.length ? `(from ${data.length} total)` : ""
            }`;
        renderPagination();
    }

    function renderPagination() {
        pagination.innerHTML = "";
        const pages = Math.ceil(filteredRows.length / rowsPerPage);

        if (pages <= 1) return;

        // Add Previous button
        const prevBtn = document.createElement("button");
        prevBtn.innerHTML =
            '<i class="fas fa-chevron-left mx-1"></i>';
        prevBtn.className = `pagination-btn mx-1 px-4 py-1 rounded ${currentPage === 1
            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
            : "bg-white text-indigo-600 hover:bg-indigo-50 border border-gray-200"
            }`;
        prevBtn.disabled = currentPage === 1;
        prevBtn.onclick = () => {
            if (currentPage > 1) {
                currentPage--;
                renderTable();
                // Scroll to top of table
                resultsContainer.scrollIntoView({
                    behavior: "smooth",
                });
            }
        };
        pagination.appendChild(prevBtn);

        // Add page numbers with dynamic range
        const maxButtons = 5;
        let startPage = Math.max(
            1,
            currentPage - Math.floor(maxButtons / 2)
        );
        let endPage = Math.min(pages, startPage + maxButtons - 1);

        if (endPage - startPage + 1 < maxButtons) {
            startPage = Math.max(1, endPage - maxButtons + 1);
        }

        // First page button if not in range
        if (startPage > 1) {
            const firstBtn = document.createElement("button");
            firstBtn.textContent = "1";
            firstBtn.className =
                "pagination-btn mx-1 px-3 py-1 rounded bg-white text-indigo-600 hover:bg-indigo-50 border border-gray-200";
            firstBtn.onclick = () => {
                currentPage = 1;
                renderTable();
                resultsContainer.scrollIntoView({
                    behavior: "smooth",
                });
            };
            pagination.appendChild(firstBtn);

            if (startPage > 2) {
                const ellipsis = document.createElement("span");
                ellipsis.textContent = "...";
                ellipsis.className = "mx-1 text-gray-500";
                pagination.appendChild(ellipsis);
            }
        }

        // Page buttons
        for (let i = startPage; i <= endPage; i++) {
            const btn = document.createElement("button");
            btn.textContent = i;
            btn.className = `pagination-btn mx-1 px-3 py-1 rounded ${i === currentPage
                ? "bg-indigo-600 text-white"
                : "bg-white text-indigo-600 hover:bg-indigo-50 border border-gray-200"
                }`;

            if (i === currentPage) {
                btn.classList.add("font-medium");
            }

            btn.onclick = () => {
                currentPage = i;
                renderTable();
                resultsContainer.scrollIntoView({
                    behavior: "smooth",
                });
            };
            pagination.appendChild(btn);
        }

        // Last page button if not in range
        if (endPage < pages) {
            if (endPage < pages - 1) {
                const ellipsis = document.createElement("span");
                ellipsis.textContent = "...";
                ellipsis.className = "mx-1 text-gray-500";
                pagination.appendChild(ellipsis);
            }

            const lastBtn = document.createElement("button");
            lastBtn.textContent = pages;
            lastBtn.className =
                "pagination-btn mx-1 px-3 py-1 rounded bg-white text-indigo-600 hover:bg-indigo-50 border border-gray-200";
            lastBtn.onclick = () => {
                currentPage = pages;
                renderTable();
                resultsContainer.scrollIntoView({
                    behavior: "smooth",
                });
            };
            pagination.appendChild(lastBtn);
        }

        // Add Next button
        const nextBtn = document.createElement("button");
        nextBtn.innerHTML =
            '<i class="fas fa-chevron-right mx-1"></i>';
        nextBtn.className = `pagination-btn mx-1 px-4 py-1 rounded ${currentPage === pages
            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
            : "bg-white text-indigo-600 hover:bg-indigo-50 border border-gray-200"
            }`;
        nextBtn.disabled = currentPage === pages;
        nextBtn.onclick = () => {
            if (currentPage < pages) {
                currentPage++;
                renderTable();
                resultsContainer.scrollIntoView({
                    behavior: "smooth",
                });
            }
        };
        pagination.appendChild(nextBtn);
    }

    function downloadCSV() {
        if (!filteredRows.length) {
            showToast("No data to export", "warning");
            return;
        }

        // Add animation to download button
        downloadBtn.innerHTML =
            '<i class="fas fa-spinner fa-spin mr-2"></i>Exporting...';
        downloadBtn.disabled = true;

        setTimeout(() => {
            try {
                const content = [headerRow, ...filteredRows]
                    .map((r) =>
                        r
                            .map(
                                (c) =>
                                    `"${c === null ||
                                        c === undefined
                                        ? ""
                                        : c
                                    }"`
                            )
                            .join(",")
                    )
                    .join("\n");
                const blob = new Blob([content], {
                    type: "text/csv;charset=utf-8;",
                });
                saveAs(
                    blob,
                    `filtered_${lastFileName || "results"}.csv`
                );

                showToast(
                    `Exported ${filteredRows.length} rows successfully`,
                    "success"
                );
            } catch (error) {
                console.error("Export error:", error);
                showToast("Failed to export data", "error");
            } finally {
                downloadBtn.innerHTML =
                    '<i class="fas fa-download mr-2"></i>Export';
                downloadBtn.disabled = false;
            }
        }, 500);
    }

    function toggleTheme() {
        isDarkMode = !isDarkMode;
        document.body.classList.toggle("theme-light", !isDarkMode);
        document.body.classList.toggle("theme-dark", isDarkMode);

        // Update theme toggle icon
        themeToggle.innerHTML = isDarkMode
            ? '<i class="fas fa-sun"></i>'
            : '<i class="fas fa-moon"></i>';

        // Save theme preference
        localStorage.setItem("darkMode", isDarkMode);
    }

    // Load theme preference
    if (localStorage.getItem("darkMode") === "true") {
        toggleTheme();
    }

    // Utility function for debouncing
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Add keyboard shortcuts
    document.addEventListener("keydown", (e) => {
        // Ctrl+F to focus search
        if (
            (e.ctrlKey || e.metaKey) &&
            e.key === "f" &&
            !e.shiftKey &&
            !e.altKey
        ) {
            if (searchContainer.classList.contains("hidden"))
                return;
            e.preventDefault();
            searchInput.focus();
        }

        // ESC to close modals
        if (e.key === "Escape") {
            helpModal.classList.add("hidden");
            suggestionsBox.classList.remove("show");
        }
    });

    // Add CSS for toast animations
    const style = document.createElement("style");
    style.textContent = `
.toast-notification {
transition: all 0.3s ease;
}
.fade-out {
opacity: 0;
transform: translateY(10px);
}
`;
    document.head.appendChild(style);

    function resetData() {
        // Clear all data
        data = [];
        headerRow = [];
        filteredRows = [];
        uniqueWords.clear();
        lastFileName = "";

        // Clear UI
        resultTable.innerHTML = "";
        resultCount.textContent = "";
        searchInput.value = "";
        columnSelect.innerHTML =
            '<option value="all">All Columns</option>';
        fileInfo.innerHTML = ""; // Clear file info

        // Show upload container and hide reset button
        fileUploadContainer.classList.remove("hidden");
        searchContainer.classList.add("hidden");
        resultsContainer.classList.add("hidden");
        noDataContainer.classList.remove("hidden");
        resetBtn.classList.add("hidden");

        // Reset file input
        fileInput.value = "";

        showToast("Excel file reset successfully", "success");
    }
});
