document.addEventListener('DOMContentLoaded', () => {
    let books = JSON.parse(localStorage.getItem('books')) || [];
    renderTable(books);

    // Открытие формы добавления
    document.getElementById('addBookBtn').addEventListener('click', () => {
        document.getElementById('addBookForm').style.display = 'block';
    });

    // Закрытие формы
    document.querySelector('.close').addEventListener('click', () => {
        document.getElementById('addBookForm').style.display = 'none';
    });

    // Открытие диалога импорта
    document.getElementById('importBtn').addEventListener('click', () => {
        document.getElementById('excelFile').click();
    });

    // Обработка импорта Excel
    document.getElementById('excelFile').addEventListener('change', handleExcelImport);

    // Поиск
    document.getElementById('searchInput').addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const filtered = books.filter(book => 
            book.author.toLowerCase().includes(query) ||
            book.title.toLowerCase().includes(query) ||
            book.genre.toLowerCase().includes(query)
        );
        renderTable(filtered);
    });

    // Сортировка
    document.getElementById('sortSelect').addEventListener('change', (e) => {
        const sortBy = e.target.value;
        let sorted = [...books];
        
        switch(sortBy) {
            case 'author': 
                sorted.sort((a, b) => a.author.localeCompare(b.author));
                break;
            case 'author_desc': 
                sorted.sort((a, b) => b.author.localeCompare(a.author));
                break;
            case 'title': 
                sorted.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case 'title_desc': 
                sorted.sort((a, b) => b.title.localeCompare(a.title));
                break;
        }
        
        renderTable(sorted);
    });

    // Добавление книги
    document.getElementById('bookForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const book = {
            id: Date.now(),
            author: formData.get('author'),
            title: formData.get('title'),
            genre: formData.get('genre') || '',
            quantity: formData.get('quantity') || '',
            location: formData.get('location') || '',
            book_id: formData.get('book_id') || '',
            notes: formData.get('notes') || ''
        };
        
        books.push(book);
        saveBooks();
        renderTable(books);
        e.target.reset();
        document.getElementById('addBookForm').style.display = 'none';
    });

    function handleExcelImport(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(event) {
            const data = new Uint8Array(event.target.result);
            const workbook = XLSX.read(data, {type: 'array'});
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            // Преобразование данных
            const importedBooks = jsonData.map(item => ({
                id: Date.now() + Math.random(),
                author: item['Автор'] || '',
                title: item['Название'] || '',
                genre: item['Жанр'] || '',
                quantity: item['Кол-во экземпляров, частей, томов'] || '',
                location: item['МЕСТОПОЛОЖЕНИЕ(№СТЕЛЛАЖА+№ПОЛКИ)'] || '',
                book_id: item['ID'] || '',
                notes: item['ПРИМЕЧАНИЯ/СОСТОЯНИЕ/НАЛИЧИЕ'] || ''
            }));

            books = [...books, ...importedBooks];
            saveBooks();
            renderTable(books);
            e.target.value = '';
        };
        reader.readAsArrayBuffer(file);
    }

    function renderTable(booksArray) {
        const tbody = document.getElementById('bookTableBody');
        tbody.innerHTML = '';

        booksArray.forEach(book => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${book.author}</td>
                <td>${book.title}</td>
                <td>${book.genre}</td>
                <td>${book.quantity}</td>
                <td>${book.location}</td>
                <td>${book.book_id}</td>
                <td>${book.notes}</td>
                <td class="actions">
                    <button class="editBtn" data-id="${book.id}">✏️</button>
                    <button class="deleteBtn" data-id="${book.id}">❌</button>
                </td>
            `;
            tbody.appendChild(row);
        });

        // Обработчики для кнопок
        document.querySelectorAll('.deleteBtn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.dataset.id);
                books = books.filter(book => book.id !== id);
                saveBooks();
                renderTable(books);
            });
        });

        document.querySelectorAll('.editBtn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.dataset.id);
                const book = books.find(b => b.id === id);
                if (book) openEditForm(book);
            });
        });
    }

    function openEditForm(book) {
        const form = document.getElementById('bookForm');
        form.querySelector('[name="author"]').value = book.author;
        form.querySelector('[name="title"]').value = book.title;
        form.querySelector('[name="genre"]').value = book.genre;
        form.querySelector('[name="quantity"]').value = book.quantity;
        form.querySelector('[name="location"]').value = book.location;
        form.querySelector('[name="book_id"]').value = book.book_id;
        form.querySelector('[name="notes"]').value = book.notes;
        
        // Временное хранение ID для редактирования
        form.dataset.editId = book.id;
        
        document.getElementById('addBookForm').style.display = 'block';
        
        // Изменение обработчика для режима редактирования
        form.onsubmit = (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const editedBook = {
                id: parseInt(form.dataset.editId),
                author: formData.get('author'),
                title: formData.get('title'),
                genre: formData.get('genre') || '',
                quantity: formData.get('quantity') || '',
                location: formData.get('location') || '',
                book_id: formData.get('book_id') || '',
                notes: formData.get('notes') || ''
            };

            books = books.map(b => b.id === editedBook.id ? editedBook : b);
            saveBooks();
            renderTable(books);
            form.reset();
            delete form.dataset.editId;
            document.getElementById('addBookForm').style.display = 'none';
        };
    }

    function saveBooks() {
        localStorage.setItem('books', JSON.stringify(books));
    }
});