'use strict'

function Scores () {  
  const height = 128
  const h = 9
  const c = h * 0.5
  const offset =  0.1
  this.isHome = true
	
  const scores = document.createElement('section')
  scores.id = 'scores'

  this.install = function (host) {
    host.appendChild(scores)
}

	this.update = function () {
    this.isHome = logbook.interface.isHome
    scores.innerHTML = ''
    const header = document.createElement('header')
    header.innerHTML = `<h1>Rhythm</h1>`
    scores.appendChild(header)

	  this.createGraph()
	  this.createLegend()
	}

	this.createGraph = function () {
    const graph = document.createElement('figure')
    graph.id = 'graph'

    const dur = this.isHome ? database.stats.filter.days : 24
    const width = 100 / dur
    let lines = ''
    
    const bars = document.createElement('div')
    bars.id = 'bars'

    this.points = []

    const d = toTimeStamp(database.stats.filter.lastEntry)
    for (let i = 0; i <= dur; i++) {
	    const x = i

      let date = new Date(d)
      date.setDate(d.getDate() - dur + i)
      const day = dayNames[date.getDay()]
      date = convertDateToDB(date)

      const bar = document.createElement('a')
      bar.href = `#${date}`
      bar.id = date
      bar.title = `${date} / ${day}`
      bar.style = `width: ${width}%;`
      if (i <= dur && i != 0) bars.appendChild(bar)
      
      // add segmentation
      lines += `<line x1="${x}" y1="0" x2="${x}" y2="${h}" vector-effect="non-scaling-stroke" style="stroke: var(--background)" fill="none" stroke-linecap="butt" stroke-width="2" />`
      // get scores as position data
      for (const s in database.scores) {
        const cat = database.scores[s].category
        if (!this.points[s]) this.points[s] = ''
        if (this.isHome) {
          // average scores over the filtered amount of days
          if (database.days[date]) {
            if (!database.days[date].scores.scores[cat]) continue
            const y = c - database.days[date].scores.average[cat]
            this.points[s] += `${x} ${y} `
            bar.title += `\n${cat}: ${database.days[date].scores.average[cat]} / ${database.days[date].scores.scores[cat].length}e`
          } else {
            this.points[s] += `${x} ${c + offset * s} `
          }     
        } else {
          // scores of this day
          this.day = database.days[page.url]
          if (this.day) {
            if (!this.day.scores.scores[cat]) continue
            // const y = c - this.day.scores.average[cat]
          }
          // console.log(this.day)
        }     
      }
    }
    const polylines = this.createLines(this.points)
    const svg = document.createElement('div')
    svg.id = 'svg'
    svg.innerHTML =
     `<svg width="100%" height="${height}" viewBox="0 0 ${dur} ${h}" preserveAspectRatio="none" class="graph" >
        ${lines}
     		<line x1="0" y1="${c}" x2="${dur}" y2="${c}" vector-effect="non-scaling-stroke" style="stroke: var(--background)" fill="none" stroke-linecap="butt" stroke-width="1" />
        ${polylines}
      </svg>`
    graph.appendChild(svg)
    graph.appendChild(bars)
    scores.appendChild(graph)
	}

  this.createLines = function ( points ) {
    let polylines = ''
    for (const c in points) {
      polylines += `<polyline points="${points[c]}" id="${database.scores[c].category}" style="stroke:${database.scores[c].color};" fill="none" stroke-width="2" stroke-linecap="round" vector-effect="non-scaling-stroke"  />`
    }
    return polylines    
  }

	this.createLegend = function () {
    const legend = document.createElement('figure')
    legend.id = 'legend'

    for (let i = 0; i < database.scores.length; i++) {
      const c = database.scores[i]
      
      const item = document.createElement('a')
      item.className = 'item'
      item.id = c.category
      item.onclick = function() { logbook.interface.scores.toggle(c.category) }

      const box = document.createElement('div')
      box.className = 'box'
      box.innerHTML =
         `<svg width="100%" height="100%">
            <rect x="0" y="0" width="100%" height="100%" style="fill:${c.color}" stroke="transparent" />
          </svg>`

      const cat = document.createElement('div')
      cat.className = 'cat'
      cat.innerHTML = c.category.toUpperCase()

      item.appendChild(box)
      item.appendChild(cat)
      legend.appendChild(item)
    }
    scores.appendChild(legend)
	}

  this.toggle = function ( category ) {
    const rect = document.querySelector(`section#scores figure#legend a#${category} div.box svg rect`)
    const line = document.querySelector(`figure#graph div#svg svg polyline#${category}`)
    if (line.style.display === 'none') {
      line.style.display = 'unset'
      rect.style.fill = database.settings.SCORES[category]
    } else {
      line.style.display = 'none'
      rect.style.fill = 'var(--b_med)'
    }
  }
}