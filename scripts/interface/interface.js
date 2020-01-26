'use strict'
const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const dayNamesLong = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

function Interface () {
  this.logbook = document.createElement('div')
  this.logbook.id = 'logbook'
  this.scores = new Scores()

  this.install = function (host) {
    host.appendChild(this.logbook)
  }

  this.update = function () {
    if (logbook.errors.length > 0) { this.errors(); return }
    const time = performance.now()
    this.logbook.innerHTML = ''

    if (page.url.length > 0) this.subPage()
    else this.home()

    // drop down data selectors
    const fromDate = document.querySelector('#fromDate')
    const toDate = document.querySelector('#toDate')
    if (fromDate) fromDate.onchange = function () { dates.from = fromDate.value; logbook.update() }    
    if (toDate) toDate.onchange = function () { dates.to = toDate.value; logbook.update() }    
    console.info(`Logbook built interface in ${(performance.now() - time).toFixed(2)}ms.`)
  }

  this.home = function () {
    this.overview()
    
    if (database.stats.filter.entries > 0) {
      // only display if there are entries
      if (database.categories) {
        // build balance UI
        this.logs = new Balance()
        this.logs.install(this.logbook)
        this.logs.update()
      }
      if (database.scores) {
        // build score graph
        this.scores.install(this.logbook)
        this.scores.update()
      }
      // build projects list and tags
      this.projects()
      this.tags()
    }
  }

  this.overview = function () {
    const overview = document.createElement('section')
    overview.id = 'overview'
    this.logbook.appendChild(overview)

    const header = document.createElement('header')    
    header.innerHTML = `<h1>Overview</h1>`
    overview.appendChild(header)
      
    const stats = database.stats.filter
    const statsEl = document.createElement('figure')
    statsEl.id = 'stats'
    overview.appendChild(statsEl)
    statsEl.innerHTML += this.datepickers()
    statsEl.innerHTML += `<h3>${stats.days}<span class="lc">d</span> / ${stats.hours}<span class="lc">h</span> / ${stats.entries}<span class="lc">e</span></h3>`

    if (database.stats.filter.entries > 0) {
      const summary = new Summary(overview)
      summary.update(database.categories)
    } else {
      const msg = document.createElement('section')
      msg.innerHTML = '<h3>There are no logged entries within the specified dates.</h3>'
      this.logbook.appendChild(msg)
    }
  }

  this.subPage = function () {
    // OVERVIEW
    const overview = document.createElement('section')
    overview.id = 'overview'
    overview.innerHTML = `<header><h3><a href="#">&lt;Logbook</a></h3></header>`
    this.logbook.appendChild(overview)
    
    this.p = database.projects[page.url]
    this.d = database.days[page.url]
    // Project or day doesn't exist?
    if (!this.p && !this.d) {
      overview.innerHTML += `<h1>404</h1>`
      overview.innerHTML += `<p>The project or date <b>'${page.url}'</b> couldn't be found in the database.</p>`
      return
    }

    if (this.d) this.dailyDetails(this.d)
    else this.projectDetails()
  }

  this.dailyDetails = function (day) {
    this.day = day
    overview.innerHTML += `<h1>${page.url}</h1>`
    const statsEl = document.createElement('figure')
    statsEl.id = 'stats'
    overview.appendChild(statsEl)
    statsEl.innerHTML += `<h3>${dayNamesLong[toTimeStamp(page.url).getDay()]}</h3>`
    statsEl.innerHTML += `<h3>${this.day.trackedHours}<span class="lc">h</span> / ${this.day.entries.length}<span class="lc">e</span></h3>`
    
    const summary = new Summary(overview)
    summary.update(this.day.categories)
    this.timeLine(overview, page.url)

    // const dailyScore = new Scores()
    // dailyScore.install(this.logbook)

    this.projects()
  }

  this.projectDetails = function () {
    this.project = database.projects[page.url]
    const entries = this.project.count
    let stats = 'This project has no entries.'
    if (entries > 0) {
      stats = `<figure id="stats">`
      stats += this.datepickers()
      stats += `
          <h3>${this.project.hours}<span class="lc">h</span> / ${this.project.count}<span class="lc">e</span></h3>
        </figure>
       `
    }
    overview.innerHTML += 
     `<h1>${this.project.NAME}</h1>
     ${stats}      
     `
    // ENTRIES
    this.logs = new Balance()
    this.logs.install(this.logbook)
    this.logs.update(page.url)

    // TAGS
    this.tags()
  }

  this.projects = function () {
    this.isHome = page.url.length === 0 ? true : false
    this.database = this.isHome ? database.projects : database.days[page.url].projects
    const projects = document.createElement('section')
    projects.id = 'projects'
    this.logbook.appendChild(projects)
    
    projects.innerHTML = `<header><h1>Projects</h1></header>`

    const categories = document.createElement('figure')
    categories.id = 'categories'
    projects.appendChild(categories)

    for (const c in database.categories) {
      const el = document.createElement('section')
      el.id = c.toLowerCase()
      el.innerHTML = `<header><h2 style="color:${database.categories[c].COLOR};">${c}</h2></header>`
      categories.appendChild(el)
    }

    const tmp = []
    // create a temp array for sorting projects by hours
    for (const id in this.database) {
      if (!this.database[id].hours) continue
      const project = this.database[id]
      project.name = id
      tmp.push(project)
    }
    tmp.sort(this.sortByHours)
    // create html from sorted projects
    for (const id in tmp) {
      const project = tmp[id]
      const data = this.database[project.name]
      const el = document.createElement('figure')
      el.id = project.name
      const hours = this.isHome ? database.stats.filter.hours : 24
      const percent = (project.hours * 100 / hours).toFixed(1)
      el.innerHTML += 
       `<h3><a href="#${project.name.toLowerCase()}">${data.NAME}</a></h3>
        <h4>${project.hours}h / ${project.count}e / ${percent}%</h4>`
      const parent = projects.querySelector(`#${(database.projects[project.name].CAT).toLowerCase()}`)
      if (parent !== null) parent.appendChild(el)
    }
  }

  this.tags = function () {
    const tagList = this.tagList(this.data)
    if (tagList.length < 1) return
    const section = document.createElement('section')
    section.id = 'tags'
    this.logbook.appendChild(section)
    section.innerHTML = `<header><h1>Tags</h1></header>`
    tags.innerHTML = 
     `<section id="tags">
        <h1>Tags</h1>
        <figure>
          ${tagList}
        </figure>
      </section>
    `
  }

  this.tagList = function () {

    this.isHome = page.url.length === 0 ? true : false
    this.data = this.isHome ? database : database.projects[page.url]

    const tmp = []
    // create a temp array for sorting tags by hours
    for (const id in this.data.tags) {
      const tag = this.data.tags[id]
      if (tag.hours) {
        tmp.push(tag)
        tmp[tmp.length - 1].name = id
      }
    }

    // const untagged = {}
    // if ()
    // untagged.name = "untagged"
    // untagged.count = this.data.count - this.data.taggedEntries
    // untagged.hours = this.data.hours - this.data.taggedHours 

    tmp.sort(this.sortByHours)
    // if (untagged.count > 0) tmp.push(untagged)

    let tagList = ''
    for (const tag in tmp) {
      const w = Math.round(tmp[tag].hours * 100 / tmp[0].hours)
      const c = this.isHome ? "#FF68A3" : database.categories[this.data.CAT].COLOR
      tagList += 
       `<figure id="stats" style="margin-top:8px;">
          <h3>${tmp[tag].name}</h3>
          <h4>${tmp[tag].hours}<span class="lc">h</span> / ${tmp[tag].count}<span class="lc">e</span></h4>
        </figure>
        <figure style="height:8px; margin-bottom:2px; border-radius: var(--rounded); background-color:var(--b_low);">
          <div style="width: ${w}%; height: 100%; background-color:${c}; border-radius: var(--rounded)"></div>
        </figure>`
    }
    return tagList
  }

  this.sortByHours = function (a, b) {
    return b.hours - a.hours;
  }

  this.datepickers = function () {
    let html =
     `<figure id="datepicker">
      <form>
        <select id="fromDate" name="fromDate">`
        for (const day in database.days) {
          day === dates.from ? html += `<option selected>${day}</option>` : html += `<option>${day}</option>`
        }
    html +=
       `</select>
      </form>
      <h3>-</h3>
      <form>
        <select id="toDate" name="toDate">`
        for (const day in database.days) {
          day === dates.to ? html += `<option selected>${day}</option>` : html += `<option>${day}</option>`
        }
    html +=
        `</select>
      </form>
      </figure>`
    return html
  }

  this.errors = function () {
    // error messages  
    const overview = document.createElement('section')
    overview.id = 'overview'
    this.logbook.appendChild(overview)
    
    const header = document.createElement('header')    
    header.innerHTML = `<h1>Error!</h1>`
    overview.appendChild(header)

    const errors = document.createElement('figure')
    errors.id = 'errors'
    overview.appendChild(errors)
    for (const e in logbook.errors) errors.innerHTML += `<h3>${logbook.errors[e].title}</h3><p>${logbook.errors[e].text}</p>`
    return
  }

  this.timeLine = function (host) {
    const date = page.url
    const timeLine = document.createElement('section')
    timeLine.id = 'timeline'
    host.appendChild(timeLine)

    const header = document.createElement('header')
    header.innerHTML = `<h1>Timeline</h1>`
    timeLine.appendChild(header)

    const ruler = document.createElement('figure')
    ruler.id = 'ruler'

    let h = 0
    const width = 100/24
    while (h < 24) {
      const hour = document.createElement('div')
      hour.id = `hour_${h}`
      hour.className = 'hour'
      hour.style = `width: ${width}%;`
      const label = document.createElement('div')
      label.id = 'label'
      label.innerHTML =`${leadingZero(h)}`
      hour.appendChild(label)
      ruler.appendChild(hour)
      h++
    }
    timeLine.appendChild(ruler)

    const items = document.createElement('figure')
    items.id = 'items'
    timeLine.appendChild(items)

    const day = database.days[date]
    const entries = day.entries
    const now = new Date()
    const dayId = toTimeStamp(day.date).getDay()
    const hours = now.getMinutes() > 30 ? leadingZero(now.getHours()+1) : leadingZero(now.getHours())
    const minutes = now.getMinutes() > 30 ? '00' : '30'

    for (const t in day.timeline) {
      const entry = day.timeline[t]
      const time = parseInt(entry.time.slice(0,2)) + parseFloat(entry.time.slice(2)) / 60
      const x = Math.round(100 / 24 * time)
      const w = Math.round(entry.duration * 100 / 24)
      const project = entry.project.toUpperCase()
      const cat = database.projects[project].CAT
      const tag = entry.tags
      const duration = entry.duration
      const color = database.categories[cat].COLOR
      items.innerHTML += `<div id="item_${t}" class="item" style="width: ${w}%; background-color:${color};" title="${project}: ${tag} / ${duration}h" color="${color}"></div>`
    }
    
    const desc = document.createElement('figure')
    desc.id = 'desc'
    desc.style = 'width: 100%; display: flex; justify-content: end;'
    desc.innerHTML = `<h3>&nbsp;</h3>`
    timeLine.appendChild(desc)

    // mouse events
    items.addEventListener("mouseover", function( event ) {
      const el = event.target
      if (el.id.slice(0,5) === 'item_') {
        el.style.backgroundColor = 'white'
        const i = el.id.slice(5)
        const entry = day.timeline[i]
        desc.innerHTML = `<h3>${entry.project}: ${entry.tags} / ${entry.duration}<span class="lc">h</span></h3>`
      }
    })

    items.addEventListener("mouseout", function( event ) {
      const el = event.target
      if (el.id.slice(0,5) === 'item_') {
        el.style.backgroundColor = el.attributes.color.nodeValue
        desc.innerHTML = `<h3>&nbsp;</h3>`
      }
    })
  }
}