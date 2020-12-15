module.exports = {
  purge: [],
  darkMode: false, // or 'media' or 'class'
  theme: {
    gridTemplateColumns: { 'fit-40': 'repeat(auto-fit, 11.25rem)' },
    extend: {
      colors: {
        lightGray: '#B5B5B5',
        darkGray: '#333333',
        veryDarkGray: '#2D2D2D',
        silver: '#C4C4C4',
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
