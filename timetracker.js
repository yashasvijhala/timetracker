const activeWin = require('active-win')
const jsonfile = require('jsonfile')
const path = require('path')
const moment = require('moment')
const screenshot = require('screenshot-desktop')
const fs = require('fs')

const dataFile = 'activity-data.json'
const screenshotsDir = 'screenshots'
let activityList = []
let lastActiveWindowName = null

async function captureAndSaveScreenshot() {
  const timestamp = moment().format('YYYYMMDDHHmmss')
  const screenshotPath = path.join(
    screenshotsDir,
    `screenshot-${timestamp}.png`
  )
  const imageBuffer = await screenshot({ format: 'png' })

  fs.writeFileSync(screenshotPath, imageBuffer)

  return screenshotPath
}

function getActiveWindow() {
  const windowInfo = activeWin.sync()
  return windowInfo && windowInfo.title
}

function updateActivityList() {
  const activeWindowName = getActiveWindow()
  if (activeWindowName !== lastActiveWindowName) {
    lastActiveWindowName = activeWindowName

    if (activeWindowName) {
      const currentDate = moment().format('YYYY-MM-DD')
      const currentTime = moment().format('HH:mm:ss')

      let existingActivity = activityList.find(
        activity => activity.name === activeWindowName
      )

      if (!existingActivity) {
        existingActivity = {
          name: activeWindowName,
          timeSpent: 0,
          dateLog: {}
        }
        activityList.push(existingActivity)
      }

      if (!existingActivity.dateLog[currentDate]) {
        existingActivity.dateLog[currentDate] = {
          date: currentDate,
          timeSpent: 0,
          log: []
        }
      }

      const screenshotPath = captureAndSaveScreenshot()

      const currentLog = {
        time: currentTime,
        elapsedTime: 1,
        screenshot: screenshotPath
      }

      existingActivity.dateLog[currentDate].log.push(currentLog)
      existingActivity.dateLog[currentDate].timeSpent += currentLog.elapsedTime
      existingActivity.timeSpent += currentLog.elapsedTime

      jsonfile.writeFileSync(dataFile, activityList, { spaces: 2 })
    }
  }
}

function loadActivityData() {
  try {
    activityList = jsonfile.readFileSync(dataFile)
  } catch (err) {
    activityList = []
  }
}

if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir)
}

loadActivityData()

setInterval(updateActivityList, 1000 * 60)

process.on('SIGINT', () => {
  jsonfile.writeFileSync(dataFile, activityList, { spaces: 2 })
  process.exit()
})
