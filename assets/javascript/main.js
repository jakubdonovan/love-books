const searchInput = document.querySelector('.search input')
const navCategoties = document.querySelectorAll('nav ul li')
const modal = document.querySelector('.modal')
const booksGrid = document.querySelector('.books')

let setTitleField = modal.querySelector('#set-title')
let setCoverField = modal.querySelector('#set-cover')
let setAuthorField = modal.querySelector('#set-author')
let setStatusField = modal.querySelector('#set-status')

let library = []


const checkLocalStorage = () => {
    localStorage.library ? library = JSON.parse(localStorage.getItem('library')) : localStorage.setItem('library', JSON.stringify(library))
}
const updateLocalStorage = () => {
    localStorage.setItem('library', JSON.stringify(library))
}


// FIREBASE CONFIGURATION
const firebaseConfig = {
    apiKey: "AIzaSyDbPIxAj2B9yjwN89ApFBr2V5TK4ZzBmRM",
    authDomain: "book-library-9c826.firebaseapp.com",
    databaseURL: "https://book-library-9c826-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "book-library-9c826",
    storageBucket: "book-library-9c826.appspot.com",
    messagingSenderId: "30331791215",
    appId: "1:30331791215:web:2739d793c70df1a139aa9a",
    measurementId: "G-S6S7PQESLP"
};
firebase.initializeApp(firebaseConfig);


// FIREBASE DATA
const saveToDB = (title, cover, author, status) => {
    firebase.database().ref(`library/${title}`).set({
        Title: title,
        Cover: cover,
        Author: author,
        Status: status
    })
}
const deleteFromDB = (title) => {
    firebase.database().ref(`library/${title}`).remove()
}
const updateDB = (title, status) => firebase.database().ref(`library/${title}`).update({Status: `${status}`})


// FIREBASE AUTH
const auth = firebase.auth()
const provider = new firebase.auth.GoogleAuthProvider()

document.querySelector('.sign-in').addEventListener('click', () => auth.signInWithPopup(provider))
document.querySelector('.sign-out').addEventListener('click', () => auth.signOut())

auth.onAuthStateChanged(user => {
    if (user) {
        console.log(firebase.User.displayName)
        document.querySelector('.sign-out').style.display = 'flex'
        document.querySelector('.user-pic').src = firebase.User.photoURL
        document.querySelector('.user-name').textContent = firebase.User.displayName
        document.querySelector('.user').style.display = 'flex'

    } else {
        document.querySelector('.user').style.display = 'none'
        document.querySelector('.sign-out').style.display = 'none'
    }
})



class Book {
    constructor(title, cover, author, status) {
        this.title = title
        this.cover = cover
        this.author = author
        this.status = status
    }
}

const populateGrid = category => {
    clearGrid()

    // Filters library and returns array of matching book objects
    if (category === 'All Books') {
        document.querySelector('.content .category-name').textContent = category
        category = library
    }
    else if (category === 'Planned' || category === 'Reading' || category === 'Dropped' || category === 'Completed') {
        document.querySelector('.content .category-name').textContent = category
        category = library.filter(book => book.status === category)
    }
    else {
        document.querySelector('.content .category-name').textContent = 'Custom Search'
        category = category
    }

    htmlGenerator(category) // Populate grid with matching books

    // Add viewBook and newBook events
    booksGrid.childNodes.forEach(node => {
        if (node.className === 'add-book') {
            node.querySelector('i').addEventListener('click', addBook)
        }
        if (node.className === 'book') {
            node.addEventListener('click', viewBook)
        }
    })

    // modal close event
    document.addEventListener('click', closeModal)
}

const clearGrid = () => { // Deletes all the books from the grid
    while (booksGrid.children.length > 1) {
        booksGrid.lastChild.remove()
    }
}

const addBook = e => {
    htmlGenerator('add book')
    setTitleField = modal.querySelector('#set-title')
    setCoverField = modal.querySelector('#set-cover')
    setAuthorField = modal.querySelector('#set-author')
    setStatusField = modal.querySelector('#set-status')
    modal.classList.toggle('reveal')
    
    
    modal.querySelector('#set-cover').addEventListener('input', () => document.querySelector('.cover img').setAttribute('src', setCoverField.value))
    modal.querySelector('.info-add button').addEventListener('click', e => {
        e.preventDefault()

        // Adds book to library
        library.push(new Book(setTitleField.value, setCoverField.value, setAuthorField.value, setStatusField.value))
        updateLocalStorage()
        saveToDB(setTitleField.value, setCoverField.value, setAuthorField.value, setStatusField.value)

        // Re-populates grid with books of current category
        populateGrid(getCurrentCategoryName())
        closeModal(e)
    })    
    
}

const deleteBook = e => {
    const matchingBook = library.find(book => book.title === e.target.parentNode.querySelector('.view-title').textContent && book.title === e.target.parentNode.querySelector('.view-title').textContent)
    library = library.filter(book => book !== matchingBook) // update library
    updateLocalStorage()
    deleteFromDB(matchingBook.title)


    populateGrid(getCurrentCategoryName()) // Re-populates grid with books of current category
    closeModal(e)
}

const viewBook = e => {
    htmlGenerator('view book')

    // get book object with title matching that of the book element data attribute
    const matchingBook = library.find(book => book.title === e.target.parentNode.getAttribute('data-title'))

    // populate modal with data
    document.querySelector('.cover img').setAttribute('src', matchingBook.cover)
    document.querySelector('.view-title').textContent = matchingBook.title
    document.querySelector('.view-author').textContent = matchingBook.author
    Object.values(document.querySelector('.view-status').options).forEach(option => 
        option.value === matchingBook.status ? option.selected = true : false
    )

    // add updateBookStatus event
    modal.querySelector('.info-view select').addEventListener('change', updateBookStatus)

    // deleteBook event
    modal.querySelector('.info-view .view-delete').addEventListener('click', deleteBook)

    modal.classList.toggle('reveal')
}

const updateBookStatus = e => {
    const matchingBook = library.find(book => book.title === modal.querySelector('.info-view .view-title').textContent)
    matchingBook.status = e.target.value;
    updateLocalStorage()
    updateDB(matchingBook.title, matchingBook.status)

    populateGrid(getCurrentCategoryName())
    closeModal(e)
}

const closeModal = e => {
    if (modal.classList.contains('reveal') && !e.target.closest('.book') && !e.target.closest('.add-book') && !e.target.closest('.modal')) {
        modal.classList.toggle('reveal', false)
        modal.innerHTML = ''
    }
}

const htmlGenerator = type => {
    // book
    if (typeof type === 'object') {
        type.forEach(match => {
            const html = `
                <div data-title="${match.title}" class="book">
                    <img class="book-cover" src="${match.cover}" alt="${match.title} cover">
                    <p class="book-title">${match.title}</p>
                    <p class="book-author">${match.author}</p>
                </div>`
            booksGrid.innerHTML += html
        })
    }

    // add book modal
    if (type === 'add book'){
        const template = `
        <p class="title">Add Book</p>
        <div class="cover">
            <img src="" alt="">
        </div>
        <form class="info-add">
            <input id="set-title" type="text" placeholder="Title" required>
            <input id="set-cover" type="text" placeholder="Cover URL">
            <input id="set-author" type="text" placeholder="Author">
            <select id="set-status" required>
                <option disabled selected hidden>Status</option>
                <option value="Planned">Planned</option>
                <option value="Reading">Reading</option>
                <option value="Dropped">Dropped</option>
                <option value="Completed">Completed</option>
            </select>
            <button type="submit">Add</button>
        </form>
        `
        modal.innerHTML = template
    }

    // view book modal
    if (type === 'view book') {
        const template = `
        <div class="cover">
            <img src="" alt="">
        </div>
        <div class="info-view">
            <button class="view-delete">Delete</button>
            <p class="view-title"></p>
            <p class="view-author"></p>
            <select class="view-status" required>
                <option disabled selected hidden>Status</option>
                <option value="Planned">Planned</option>
                <option value="Reading">Reading</option>
                <option value="Dropped">Dropped</option>
                <option value="Completed">Completed</option>
            </select>
        </div>
        `
        modal.innerHTML = template
    }
}

const getCurrentCategoryName = () => { // Returns the current book category name
    const category = document.querySelector('.content .category-name').textContent
    return category
}

const bookSearch = e => {
    const searchQuery = e.target.value.toLowerCase()
    const matchingBook = library.filter(book => book.title.toLowerCase().includes(searchQuery) || book.author.toLowerCase().includes(searchQuery))

    populateGrid(matchingBook)
}


// search event listener
searchInput.addEventListener('input', bookSearch)

// Adds event to each category in the nav
navCategoties.forEach(category => category.addEventListener('click', () => {
    populateGrid(category.textContent)
    searchInput.value = ''
}))

checkLocalStorage()
populateGrid('All Books')
