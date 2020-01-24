'use strict'

function Scores () {
  const scores = document.createElement('section')
  scores.id = 'scores'
  const header = document.createElement('header')
  const graph = document.createElement('figure')
  graph.id = 'graph'
  const legend = document.createElement('figure')
  legend.id = 'legend'
  
	this.install = function (host) {
	  scores.appendChild(header)
	  scores.appendChild(graph)
	  scores.appendChild(legend)
	  host.appendChild(scores)
    header.innerHTML = `<h1>Rhythm</h1>`
}

	this.update = function () {
	  this.createGraph()
	  this.createLegend()
	}

	this.createGraph = function () {
    const dur = database.stats.filter.days
    const width = 100 / dur
    const height = 128
    const h = 9
    const c = h * 0.5
    const offset =  0.1
    const strokeWidth = 2
    let lines = ''
    this.points = []
    
    const bars = document.createElement('div')
    bars.id = 'bars'

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
        if (database.days[date] && database.days[date]) {
          if (!database.days[date].scores.scores[cat]) continue
          const y = c - database.days[date].scores.average[cat]
          this.points[s] += `${x} ${y} `
          bar.title += `\n${cat}: ${database.days[date].scores.average[cat]} / ${database.days[date].scores.scores[cat].length}e`
        } else {
          this.points[s] += `${x} ${c + offset * s} `
        }          
      }
    }

    let polylines = ''
    for (const c in this.points) {
      polylines += `<polyline points="${this.points[c]}" style="stroke:${database.scores[c].color}" fill="none" stroke-width="${strokeWidth}" stroke-linecap="round" vector-effect="non-scaling-stroke"  />`
    }

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
	}

	this.createLegend = function () {
    for (let i = 0; i < database.scores.length; i++) {
      const c = database.scores[i]
      
      const item = document.createElement('a')
      item.className = 'item'
      // item.onclick = function() { logbook.interface.scores.createGraph() }

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
	}
}