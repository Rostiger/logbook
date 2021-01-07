'use strict'
const database = {}
const dates = { from : 0, to : 0 }
const page = { url : '' }

function Logbook () {
  this.errors = []
  this.database = new Database()
  this.interface = new Interface()

  this.install = function (host) {
    this.database.install()
    this.interface.install(host)
  }

  this.start = function () {
    // stop at errors
    if (this.errors.length > 0) this.interface.update()
    else {
      this.database.start()
      this.update()
    }
  }

  this.update = function (updateDB = true, input = window.location.hash) {
    page.url = input.toUrl().toUpperCase()
    setTimeout(() => { window.scrollTo(0, 0) }, 250)
    if (updateDB) this.database.update(dates)
    this.interface.update()
  }
}