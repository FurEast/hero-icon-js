const fs         = require('fs')
const path       = require('path').posix
const beautify   = require('js-beautify').js
const { minify } = require('terser')

void(async () => {
  await generate('node_modules/heroicons/outline', 'outline', 'HeroIconOutline')
  await generate('node_modules/heroicons/solid', 'solid', 'HeroIconSolid')
})()

async function generate(src, variant, className) {
  const files = fs.readdirSync(src).filter(file => path.extname(file).toLowerCase() === '.svg')

  let icons  = ''
  let svgTag = ''

  files.forEach(file => {

    const name  = path.parse(file).name
    const svg   = fs.readFileSync(path.join(src, file), 'utf-8')

    let content = ''

    svg.split('\n').forEach(line => {

      // get first svg tag
      if (svgTag == '' && line.startsWith('<svg ')) {
        const vb = line.match(/viewBox\=\"([A-Za-z0-9 _]*)\"/)[1].replace('0 0 ', '').split(' ')
        svgTag = line.replace('<svg', `<svg width="${vb[0]}" height="${vb[1]}"`)
      }

      // just collect the contents of the svg
      if (line.startsWith('<svg') === false && line.startsWith('</svg>') === false) {
        content += line.trim()
      }
    })

    icons += `'${name}': \`${content}\`,\n`
  })

  const script = `
  /*!
  * hero-icon-js v1.0.1 (https://github.com/jarstone/hero-icon-js)
  * Licensed under MIT (https://github.com/jarstone/hero-icon-js/blob/main/LICENSE)
  */
  class ${className} extends HTMLElement {
    connectedCallback() {
      this.insertAdjacentHTML('afterend', this.svgTag + this.icons[this.name] + '</svg>')
      this.class && this.nextElementSibling.setAttribute('class', this.class)
      this.width && this.nextElementSibling.setAttribute('width', this.width)
      this.height && this.nextElementSibling.setAttribute('height', this.height)
      this.remove()
    }
    get svgTag() {
      return \`${svgTag}\`
    }
    get name() {
      return this.getAttribute('name')
    }
    get class() {
      return this.getAttribute('class')
    }
    get width() {
      return this.getAttribute('width')
    }
    get height() {
      return this.getAttribute('height')
    }
    get icons() {
      return {
        ${icons}
      }
    }
  }
  customElements.define('hero-icon-${variant}', ${className})
  `

  fs.writeFileSync(`hero-icon-${variant}.js`, beautify(script, { indent_size: 2 }))
  fs.writeFileSync(`hero-icon-${variant}.min.js`, (await minify(script, { format: { quote_style: 1 } })).code)

}