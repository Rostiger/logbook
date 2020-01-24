'use strict'

function Database () {

	this.install = function () {
    database.settings = indental(DATABASE.settings)
    if (DATABASE.logs) database.logs = tablatal(DATABASE.logs)
    else this.error(`Couldn't find 'Logbook' database!`,`Please make sure there is a file named logbook.tbtl in the database folder that starts with 'DATABASE.logs ='`)

    // initialise categories & projects
    database.categories = {}
    for (const c in database.settings.CATEGORIES) database.categories[c] = { COLOR : database.settings.CATEGORIES[c] }
    database.projects = {}
    for (const p in database.settings.PROJECTS) {
      const project = database.settings.PROJECTS[p]
      const name = project.NAME == undefined ? p : project.NAME
      if (!project.CAT) this.error(`Missing category:`,`Project <b>'${project}'</b> has no category. Please update settings.ndtl.`)
      else if (!database.categories[project.CAT]) this.error(`Couldn't match category '${project.CAT}'`,`Project <b>'${name}'</b> has the category <b>'${project.CAT}'</b>.<br /> This category doesn't exist in settings.ndtl. Please update the settings file.`)
      database.projects[p] = { CAT : project.CAT, NAME : name } 
    }

    // initialise scores
    database.scores = []
    for (const s in database.settings.SCORES) {
      const cat = { category : s, color : database.settings.SCORES[s] }
      database.scores.push(cat)
    }
    
    database.days = {}
    database.tags = {}
    database.stats = {}
    database.stats.total = {
      firstEntry : 0,
      lastEntry : 0,
      days : 0,
      hours : 0,
      entries : 0
    }
	}

  this.start = function () {
    
    // loop through logbook entries starting with the oldest entry
    const time = performance.now()
    const entries = database.logs
    const first = entries.length - 1
    let day

    for (let id = first; id >= 0; id--) {
      const entry = entries[id]
      if (id === first) {
        // first entry
        // check validity
        if (entry.date.charAt(0) === "-") { console.info(`First entry in Logs Database doesn't have a date!`); return }
        if (entry.project.charAt(0) === "-") { console.info(`First entry in Log doesn't have a project!`); return }
        database.stats.total.firstEntry = entry.date
        this.addDay(entry)
        day = database.days[entry.date]
      } else {
        const prevEntry = day.entries[day.entries.length - 1]
        const diff = toTimeStamp(prevEntry.date) - toTimeStamp(entry.date)
        // TODO: add check for proper times
        const isPrevDay = diff > 0 ? true : false
        const isSameDay = diff == 0 || entry.date.charAt(0) === "-" ? true : false
        if (isSameDay) day.entries.push(entry)
        else {
          day.update()
          this.addDay(entry)
          day = database.days[entry.date]
          if (!isPrevDay) day.firstEntry = prevEntry
        }
      }
      if (id == 0) {
        day.update()
        database.stats.total.lastEntry = day.date
      }
      // update stats
      database.stats.total.entries += 1
    }
    for (const cat in database.categories) database.categories[cat].percentage = parseFloat((database.categories[cat].hours * 100 / database.stats.hours).toFixed(2))
    console.info(`Found ${database.stats.total.entries} entries in database, in ${(performance.now() - time).toFixed(2)}ms.`)
  }

  this.update = function (params) {

    const time = performance.now()
    database.stats.filter = {
      firstEntry : 0,
      lastEntry : 0,
      days : 0,
      hours : 0,
      entries : 0
    }

    // check date validity
    this.to = this.isValidDate(dates.to) ? convertDateToDB(toTimeStamp(dates.to.toString())) : convertDateToDB(new Date())
    this.from = this.isValidDate(dates.from) ? convertDateToDB(toTimeStamp(dates.from.toString())) : this.shiftDate(this.to, -31)
    // odd date combincation handling
    if (parseInt(this.to) < parseInt(this.from)) this.from = this.shiftDate(this.to, -30)

    dates.from = this.from
    dates.to = this.to

    
    const from = toTimeStamp(this.from)
    const to = toTimeStamp(this.to)
    const dayCount = Math.round((to - from) / (60 * 60 * 1000 * 24))
    const days = {}

    // update stats
    database.stats.filter.firstEntry = this.from
    database.stats.filter.lastEntry = this.to
    database.stats.filter.entries = 0
    database.stats.filter.hours = 0
    database.stats.filter.days = dayCount + 1
    
    // reset categories
    for (const c in database.categories) { database.categories[c].hours = 0; database.categories[c].percentage = 0 }

    //reset projects
    for (const p in database.projects) { database.projects[p].hours = 0; database.projects[p].count = 0; database.projects[p].tags = {} }

    // reset tags
    for (const t in database.tags) { database.tags[t].hours = 0; database.tags[t].count = 0; }

    // get data between from - to dates
    for (let i = 0; i <= dayCount; i++) {
      let day = new Date(to)
      day.setDate(to.getDate() - i)
      day = convertDateToDB(day)
      day = database.days[day]
      if (!day) continue      

      // add hours to projects
      this.filterEntries(day)

      // add hours to categories
      for (const c in day.categories) {
        const cat = database.categories[c]
        cat.hours += day.categories[c].hours
      }

      // add hours to stats
      database.stats.filter.hours += day.trackedHours
      database.stats.filter.entries += day.entries.length
    }

    // calculate category percentages
    for (const c in database.categories) {
      const cat = database.categories[c]
      if (!cat.hours) cat.hours = 0
      cat.percentage = parseFloat((cat.hours * 100 / database.stats.filter.hours).toFixed(2))
      if (isNaN(cat.percentage)) cat.percentage = 0
    }
    console.info(`Filtered ${database.stats.filter.entries} entries from ${this.from} to ${this.to}, in ${(performance.now() - time).toFixed(2)}ms.`)
    console.info(database)
  }

  this.isValidDate = function (date, filtered = false) {
    if (date === undefined || isNaN(date) || date === 0) return false
    return true
  }

  this.addDay = function (entry) {
    database.days[entry.date] = new Day(entry.date)
    database.days[entry.date].entries.push(entry)
    database.stats.total.days += 1
  }

  this.filterEntries = function (day) {
    if (!day.projects) return
    for (const p in day.projects) {
      if (database.projects[p]) {
        const project = database.projects[p]

        if (!project.hours) project.hours = 0
        if (!project.count) project.count = 0
        if (!project.firstEntry) project.firstEntry = day.date
        if (!project.tags) project.tags = {}

        // update the project hours
        project.hours += day.projects[p].hours
        project.count += day.projects[p].count

        // update the project tags
        this.filterTags(day, p)
      } else console.warn(`Couldn't find project in Projects Database at entry ${day.date}: ${p}`)
    }
  }

  this.shiftDate = function (date, amount, format = true) {
    this.dateOld = toTimeStamp(date)
    this.dateNew = new Date(this.dateOld)
    this.dateNew.setDate(this.dateOld.getDate() + amount)
    return format ? convertDateToDB(this.dateNew) : this.date    
  }

  this.filterTags = function (day, project) {
    const p = project
    for (const t in day.projects[p].tags) {
      const tag = day.projects[p].tags[t]
      // add tags to project
      if (!database.projects[p].tags[t]) database.projects[p].tags[t] = { count : 0, hours : 0 } 
      const filterTag = database.projects[p].tags[t]
      filterTag.hours += tag.hours
      filterTag.count += 1
      // add totals to tags
      if (!database.tags[t]) database.tags[t] = { count : 0, hours : 0 }       
      const totalTag = database.tags[t]
      totalTag.hours += tag.hours
      totalTag.count += 1
      // track categories
      if (!totalTag.categories) totalTag.categories = {}
      if (!totalTag.categories[database.projects[p].CAT]) totalTag.categories[database.projects[p].CAT] = { hours : 0, count : 0}
      const catTag = totalTag.categories[database.projects[p].CAT]
      catTag.hours += tag.hours
      catTag.count += 1
   }
  }

  this.error = function (title, message) {
      const error = {}
      error.title = title
      error.text = message
      logbook.errors.push(error)  
  }
}