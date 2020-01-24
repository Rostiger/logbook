'use strict'

function Balance () {
	const balance = document.createElement('section')
	balance.id = 'balance'
  const header = document.createElement('header')
  const bars = document.createElement('section')
  bars.id = 'bars'
  const footer = document.createElement('footer')

  const dailyDetails = document.createElement('section')
  dailyDetails.id = 'dailyDetails'

	this.install = function (host) {
    balance.appendChild(header)
    balance.appendChild(bars)
    balance.appendChild(footer)    
    host.appendChild(balance)
  }

  this.update = function (project = null) {
    this.createBars(project)
  }

  this.createBars = function (project) {
    const today = document.createElement('span')
    today.id = 'today'

    header.innerHTML = 
     `<h1>Logs</h1>`

    // first & last days date
    const dur = database.stats.filter.days
    const to = toTimeStamp(database.stats.filter.lastEntry)
    let from = to
    const width = 100 / dur

    for (let i = dur; i > 0 ; i--) {
      const bar = document.createElement('a')
      const day = new Date(to)
      day.setDate(to.getDate() - i + 1)
      const date = convertDateToDB(day)
      if (i == dur) from = date
      
      bar.href = `#${date}`
      bar.id = date
      bar.style = `width: ${width}%;`
      bar.title = date
      bars.appendChild(bar)

      // assemble daily overview
      const title = {}
      const cats = database.categories
      if (database.days[date] && i <= dur) {
        if (project) {
          //get project
          if (!database.days[date].projects[project]) continue
          const day = database.days[date]
          const cat = database.projects[project].CAT
          const hours = day.projects[project].hours
          const percent = parseFloat((hours * 100 / 24).toFixed(1))
          const color = database.categories[cat].COLOR
          bar.innerHTML = this.addSegment(percent, color)
        } else {
          // get categories
          for (const c in cats) {
            const cat = database.days[date].categories[c]
            if (cat && cat.percentage > 0) {
              bar.innerHTML += this.addSegment(Math.ceil(cat.percentage), database.categories[c].COLOR)
              title[c] = `\n${c}: ${cat.percentage}% / ${cat.hours}h`
            }
          }
        }
        bar.title += ` / ${dayNames[toTimeStamp(date).getDay()]} / ${database.days[date].entries.length}e`
        for (const t in title) bar.title += title[t]
      }

      // mouse events
      bar.addEventListener("mouseover", function( event ) {
        let el = event.target
        while (el.parentElement.id !== 'bars') el = el.parentElement
        today.innerHTML = `<b>${el.id}</b>`
      }, false);
    }
    
    const firstDateContainer = document.createElement('span')
    const lastDateContainer = document.createElement('span')
    firstDateContainer.id = 'firstDate'
    lastDateContainer.id = 'lastDate'
    firstDateContainer.innerHTML += from
    lastDateContainer.innerHTML += convertDateToDB(to)

    footer.appendChild(firstDateContainer)
    footer.appendChild(today)
    footer.appendChild(lastDateContainer)
  }

  this.addSegment = function (height, color) {
    const html = 
     `<svg width="100%" height="${height}%">
        <rect x="0" y="0" width="100%" height="100%" fill="${color}" stroke="none" />
      </svg>`
    return html
  }

  this.diff = function (start, end) {
    return Math.round((start - end)/60/60/1000 * 2) * 0.5
  }
}