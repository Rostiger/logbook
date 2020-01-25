'const strict'

function Day (date) {
	this.date = date
	this.entries = []
	this.categories = {}
	this.projects = {}
	this.firstEntry = {}
	this.timeline = []
	this.trackedHours = 0

	this.update = function () {
		//  parse entries
		for (const e in this.entries) {
			const entry = this.entries[e]
			let hours = 0

			// store the entries timestamp
			entry.timeStamp = toTimeStamp(this.date, entry.time)

			// pick the previous entries timestamp (midnight if it's the first entry)
			const prevEntry = e == 0 ? { timeStamp : toTimeStamp(entry.date) } : this.entries[e-1]
			let project = e == 0 ? this.firstEntry.project : prevEntry.project
			let tags = e == 0 ? this.firstEntry.tags : prevEntry.tags
			let score = e == 0 ? this.firstEntry.scr : prevEntry.scr
			let time = e == 0 ? "0000" : prevEntry.time

			if (prevEntry.project === "!") continue
			hours = (entry.timeStamp - prevEntry.timeStamp) / (60 * 60 * 1000)
			if (hours > 24) console.warn(`Logging error detected in logbook at ${this.date}: ${entry.time}`)
			else if (project) {
				this.addHours(hours, project, tags)
				this.addTimeLineEntry(time, hours, project, tags)
			}
			if (score && database.scores) this.scores.add(score)

			// calculate hours and add the to the project
			if (e == this.entries.length - 1) {
				// add the days remaining hours to the last entry
				const nextDay = { timeStamp : toTimeStamp(this.date)}
				nextDay.timeStamp.setDate(nextDay.timeStamp.getDate() + 1)
				
				// check if the next day is in the future
				let diff = nextDay.timeStamp - entry.timeStamp
				const isFuture = new Date() - nextDay.timeStamp < 0 ? true : false					
				if (isFuture) diff = new Date() - entry.timeStamp
				
				// calculate the hours
				hours = parseFloat((diff / (60 * 60 * 1000)).toFixed(1))
				this.addHours(hours, entry.project, entry.tags)
				this.addTimeLineEntry(entry.time, hours, entry.project, entry.tags)
			}

			// end at current time			
			if (new Date() - entry.timeStamp < 0) break
		}
		// update stats
    database.stats.total.hours += this.trackedHours
		
		// calculate category percentages
		for (const c in this.categories) {
			const cat = this.categories[c]
			cat.percentage = parseFloat((cat.hours * 100 / 24).toFixed(1))
		}

		// calculate score averages
		this.scores.getAverages()
	}

	this.scores = {
		scores : {},
		average : {},
		add : function (score) {
			for (let i = 0; i < score.length; i++) {
				const s = parseInt(score[i])
				if (!database.scores[i]) { console.warn(`Can't map score to category. Add more categories to scores.ndtl`); continue }
				const cat = database.scores[i].category
				if (!this.scores[cat]) this.scores[cat] = []
				if (!isNaN(s)) this.scores[cat].push(10 - s - 5)
			}
		},
		getAverages : function () {
			for (const s in this.scores) {
				const cat = this.scores[s]
				const avrg = parseFloat((this.getSum(cat) / cat.length).toFixed(2))
				this.average[s] = isNaN(avrg) ? 0 : avrg
			}
		},
		getSum : function (array) {
			let sum = 0 
			let i = array.length
			while (i--) sum += array[i]
			return sum
		}
	}

	this.addHours = function (hours, project, tags, time) {
		// check if project exists
		project = project.toUpperCase()
		const prj = database.projects[project]
		if (prj) {
			const cat = prj.CAT
			// add hours to project
			if (!this.projects[project]) this.projects[project] = { hours : 0, count: 0, tags : {}, NAME : project, CAT : cat,  }
			this.projects[project].hours += hours
			this.projects[project].count += 1
			// add tag
			const tag = this.parseTag(tags)
    	if (tag) this.addTag(tag, hours, this.projects[project].tags)
			// add hours to categories
			if (!this.categories[cat]) this.categories[cat] = { hours : 0, percentage : 0 }
			this.categories[cat].hours += hours
			// add hours to checkSum
			this.trackedHours += hours
		} else console.warn(`Project ${project} on day ${this.date} doesn't exist in projects database.`)
	}

	this.addTimeLineEntry = function (time, hours, project, tags) {
		// add data to timeline
		const data = { time : time, duration : hours, project : project, tags : tags }
		this.timeline.push(data)
	}

  this.addTag = function (tag, hours, object) {
  	if (!object[tag]) object[tag] = { count : 0, hours : 0 }
    object[tag].count += 1
    object[tag].hours += hours
  }

  this.parseTag = function (string) {
    let tag = string.split('#')[1]
    if (tag) tag = tag.split(' ')[0]
    else return null
    return tag
  }
}