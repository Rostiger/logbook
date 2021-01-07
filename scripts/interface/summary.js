'use strict'

function Summary (host) {
  const total = document.createElement('section')
  total.id = 'total'
  host.appendChild(total)

	this.update = function (categories) {

    const bars = document.createElement('figure')
    bars.id = 'bars'
    total.appendChild(bars)

    const legend = document.createElement('figure')
    legend.id = 'legend'
    total.appendChild(legend)

    for (const c in database.categories) {
      const cat = categories[c]
      if (!cat) continue
      const color = database.categories[c].COLOR
      const width = cat.percentage === 0 ? 1 : cat.percentage
      bars.innerHTML +=
       `<div class="bar" style="width:${width}%">
          <div style="color:${color};">${cat.percentage}%</div>
          <svg width="100%" height="100%">
            <rect x="0" y="0" width="100%" height="100%" fill="${color}" stroke="transparent" />
          </svg>
        </div>`
      legend.innerHTML +=
       `<div class="item">
          <div class="box">
            <svg width="100%" height="100%">
              <rect x="0" y="0" width="100%" height="100%" fill="${color}" stroke="transparent" />
            </svg>
          </div>
          <div class="cat">${c}</div>
        </div>`
    }		
	}	
}