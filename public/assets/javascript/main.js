const searchInput = document.querySelector('.search input')
const signInButton = document.querySelector('#sign-in')
const userButton = document.querySelector('#user')
const navCategoties = document.querySelectorAll('nav ul li')

const modalBackdrop = document.querySelector('#modal-backdrop')
const modal = document.querySelector('#modal')
const booksGrid = document.querySelector('.books')

let setTitleField = modal.querySelector('#set-title')
let setCoverField = modal.querySelector('#set-cover')
let setAuthorField = modal.querySelector('#set-author')
let setStatusField = modal.querySelector('#set-status')

let library = [{ title:'Solo Leveling', cover:"https://cdn1.booknode.com/book_cover/1163/full/solo-leveling-1162604.jpg", author:"Chugong", status:"Completed"}]

// LOCAL STORAGE
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


// FIREBASE AUTH
const googleLogin = () => {
    const auth = firebase.auth()
    const provider = new firebase.auth.GoogleAuthProvider()
    let user

    auth.signInWithPopup(provider)
        .then(result => {
            user = result.user
        })

    auth.onAuthStateChanged(user => {
        if (user) {
            signInButton.classList.toggle('hidden')
            userButton.classList.toggle('hidden')
            document.querySelector('#user-button img').src = user.photoURL
            document.querySelector('#user-email').innerHTML += user.email
            
            userButton.addEventListener('click', () => {
                userButton.querySelector('#user-settings').classList.toggle('hidden')
                userButton.querySelector('#sign-out').addEventListener('click', () => {
                    auth.signOut()
                    document.querySelector('#user-button img').src = ''
                    userButton.classList.toggle('hidden')
                    signInButton.classList.toggle('hidden')
                })
            })
        }
    })
}

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
const updateBookStatusInDB = (title, status) => firebase.database().ref(`library/${title}`).update({ Status: `${status}` })

signInButton.addEventListener('click', googleLogin)


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
        document.querySelector('#category-name').textContent = category
        category = library
    }
    else if (category === 'Planned' || category === 'Reading' || category === 'Dropped' || category === 'Completed') {
        document.querySelector('#category-name').textContent = category
        category = library.filter(book => book.status === category)
    }
    else {
        document.querySelector('#category-name').textContent = 'Custom Search'
        category = category
    }

    htmlGenerator(category) // Populate grid with matching books

    // Add viewBook and newBook events
    booksGrid.childNodes.forEach(node => {
        if (node.id === 'add-book') {
            node.querySelector('i').addEventListener('click', addBook)
        }
        if (node.id === 'book') {
            node.addEventListener('click', viewBook)
        }
    })

    // modal close events
    modalBackdrop.addEventListener('click', closeModalOnClickOutside)
    window.addEventListener('keyup', closeModalOnEsc)
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
    modalBackdrop.classList.toggle('hidden')

    modal.querySelector('#set-cover').addEventListener('input', () => document.querySelector('.cover img').setAttribute('src', setCoverField.value))
    modal.querySelector('.info-add button').addEventListener('click', e => {
        e.preventDefault()

        // Adds book to library
        library.push(new Book(setTitleField.value, setCoverField.value, setAuthorField.value, setStatusField.value))
        updateLocalStorage()
        saveToDB(setTitleField.value, setCoverField.value, setAuthorField.value, setStatusField.value)

        // Re-populates grid with books of current category
        populateGrid(getCurrentCategoryName())

        modalBackdrop.classList.toggle('hidden')
        closeModalOnClickOutside(e)
    })
}

const deleteBook = e => {
    const matchingBook = library.find(book => book.title === e.target.parentNode.querySelector('.view-title').textContent && book.title === e.target.parentNode.querySelector('.view-title').textContent)
    library = library.filter(book => book !== matchingBook) // update library
    updateLocalStorage()
    deleteFromDB(matchingBook.title)


    populateGrid(getCurrentCategoryName()) // Re-populates grid with books of current category
    modalBackdrop.classList.toggle('hidden')
    closeModalOnClickOutside(e)
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

    modalBackdrop.classList.toggle('hidden')
}


const updateBookStatus = e => {
    const matchingBook = library.find(book => book.title === modal.querySelector('.info-view .view-title').textContent)
    matchingBook.status = e.target.value;
    updateLocalStorage()
    updateBookStatusInDB(matchingBook.title, matchingBook.status)

    populateGrid(getCurrentCategoryName())
}

const closeModalOnClickOutside = e => {
    if (!e.target.closest('#modal')) {
        modal.innerHTML = ''
        modalBackdrop.classList.toggle('hidden')
    }
}
const closeModalOnEsc = e => {
    if (!modalBackdrop.className.includes('hidden') && (e.key == 'Escape' || e.key == 'Esc')){
        modal.innerHTML = ''
        modalBackdrop.classList.toggle('hidden')
    }
}

const htmlGenerator = type => {
    // book
    if (typeof type === 'object') {
        type.forEach(match => {
            const html = `
                <div data-title="${match.title}" id="book" class="w-full h-full rounded-xl">
                    <img class="book-cover w-full h-60 rounded-xl" src="${match.cover}" alt="${match.title}">
                    <p class="book-title mt-2 text-xl font-medium text-veryDarkGray">${match.title}</p>
                    <p class="book-author text-base font-medium text-lightGray">${match.author}</p>
                </div>`
            booksGrid.innerHTML += html
        })
    }

    // add book modal
    if (type === 'add book') {
        const template = `
        <p class="w-full text-xl font-semibold text-center text-darkGray title">Add Book</p>
                
        <div class="flex w-full h-52 gap-x-1">
            <div class="h-full cover">
                <img class="h-full" src="" alt="">
            </div>
        
            <form class="flex flex-col justify-between flex-1 h-full info-add">
                <input id="set-title"
                    class="w-full p-1 font-bold text-gray-500 truncate border-2 border-gray-300 rounded-md outline-none"
                    type="text" placeholder="Title" required>
                <input id="set-cover"
                    class="w-full p-1 font-bold text-gray-500 truncate border-2 border-gray-300 rounded-md outline-none appearance-none"
                    type="text" placeholder="Cover URL">
                <input id="set-author"
                    class="w-full p-1 font-bold text-gray-500 truncate border-2 border-gray-300 rounded-md outline-none"
                    type="text" placeholder="Author">
                <select id="set-status"
                    class="w-full p-1 font-bold text-gray-500 border-2 border-gray-300 rounded-md outline-none appearance-none"
                    required>
                    <option disabled selected hidden>Status</option>
                    <option value="Planned">Planned</option>
                    <option value="Reading">Reading</option>
                    <option value="Dropped">Dropped</option>
                    <option value="Completed">Completed</option>
                </select>
                <button class="block w-full p-1 font-bold text-white bg-red-500 border-2 border-gray-300 rounded-md"
                    type="submit">Add</button>
            </form>
        </div>
        `
        modal.innerHTML = template
    }

    // view book modal
    if (type === 'view book') {
        const template = `
        <div class="flex w-full h-52 gap-2 sm:gap-5">
            <div class="h-full cover">
                <img class="h-full" src="" alt="">
            </div>

            <div class="flex flex-col w-80 info-view flex-1 sm:flex-3">
                <button class="self-end w-20 text-white bg-red-500 rounded-md view-delete">Delete</button>
                <p class="text-xl font-semibold view-title text-veryDarkGray"></p>
                <p class="view-author text-lightGray"></p>
                <select
                    class="w-32 mt-1 text-sm text-center bg-white shadow-md outline-none appearance-none roun ded-md h-7 text-darkGray view-status"
                    required>
                    <option disabled selected hidden>Status</option>
                    <option value="Planned">Planned</option>
                    <option value="Reading">Reading</option>
                    <option value="Dropped">Dropped</option>
                    <option value="Completed">Completed</option>
                </select>
            </div>
        </div>
        `
        modal.innerHTML = template
    }
}

const getCurrentCategoryName = () => { // Returns the current book category name
    const category = document.querySelector('#category-name').textContent
    return category
}

const bookSearch = e => {
    const searchQuery = e.target.value.toLowerCase()
    const matchingBook = library.filter(book => book.title.toLowerCase().includes(searchQuery) || book.author.toLowerCase().includes(searchQuery))

    populateGrid(matchingBook)
}


// mobile nav event
document.querySelector('.hamburger').addEventListener('click', () => document.querySelector('.mobile-nav').classList.toggle('hidden'))

// search event listener
searchInput.addEventListener('input', bookSearch)

// Adds event to each category in the nav
navCategoties.forEach(category => category.addEventListener('click', () => {
    populateGrid(category.textContent)
    searchInput.value = ''
}))

checkLocalStorage()
populateGrid('All Books')
