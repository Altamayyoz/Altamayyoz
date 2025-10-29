import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const out = path.resolve(__dirname, '../src/data')
if (!fs.existsSync(out)) fs.mkdirSync(out, { recursive: true })

function randChoice<T>(arr: T[]) { return arr[Math.floor(Math.random()*arr.length)] }

// Users - preserve original users.json if it exists, otherwise create default ones
const usersPath = path.join(out, 'users.json')
let users = []
if (!fs.existsSync(usersPath)) {
  const roles = ['Admin','ProductionWorker','Supervisor','PlanningEngineer','TestPersonnel','QualityInspector']
  users = Array.from({length:20}).map((_,i)=>({id:`u${i+1}`,name:`User ${i+1}`,username:`user${i+1}`,role: randChoice(roles)}))
  fs.writeFileSync(usersPath, JSON.stringify(users,null,2))
} else {
  users = JSON.parse(fs.readFileSync(usersPath, 'utf8'))
}

// Operations 120
const operations = Array.from({length:120}).map((_,i)=>({id:`op-${i+1}`,code:`OP-${1000+i+1}`,description:`Operation ${i+1}`}))
fs.writeFileSync(path.join(out,'operations.json'), JSON.stringify(operations,null,2))

// Job Orders 30
const jobOrders = Array.from({length:30}).map((_,i)=>({id:`jo-${i+1}`,title:`Job Order ${i+1}`,status:randChoice(['open','in_progress','completed','on_hold']),progress:Math.floor(Math.random()*100),assignedTo:[users[i%users.length].id],devices:[`dev-${i+1}`],createdAt:new Date(Date.now()-Math.random()*1000*60*60*24*30).toISOString()}))
fs.writeFileSync(path.join(out,'jobOrders.json'), JSON.stringify(jobOrders,null,2))

// Devices 200
const devices = Array.from({length:200}).map((_,i)=>({id:`dev-${i+1}`,serial:`SN-${1000+i+1}`,name:`Device ${i+1}`,location: randChoice(['Line A','Line B','Warehouse'])}))
fs.writeFileSync(path.join(out,'devices.json'), JSON.stringify(devices,null,2))

// TaskEntries 500
const taskEntries = Array.from({length:500}).map((_,i)=>({id:`te-${i+1}`,jobOrderId:randChoice(jobOrders).id,operationId:`op-${(i%120)+1}`,technicianId:users.filter((u: any)=>u.role==='ProductionWorker')[i%Math.max(1,users.filter((u: any)=>u.role==='ProductionWorker').length)]?.id || users[i%users.length].id,serialNumbers:[`SN-${2000+i}`],startTime:new Date(Date.now()-Math.random()*1000*60*60*24*30).toISOString(),standardTime:300,actualTime:200+Math.floor(Math.random()*400),notes:'generated',status:randChoice(['draft','submitted','approved'])}))
fs.writeFileSync(path.join(out,'taskEntries.json'), JSON.stringify(taskEntries,null,2))

// Alerts 50
const alerts = Array.from({length:50}).map((_,i)=>({id:`al-${i+1}`,level:randChoice(['info','warning','critical']),message:`Alert ${i+1}`,createdAt:new Date().toISOString()}))
fs.writeFileSync(path.join(out,'alerts.json'), JSON.stringify(alerts,null,2))

// Notifications 100
const notifications = Array.from({length:100}).map((_,i)=>({id:`n-${i+1}`,title:`Notification ${i+1}`,read:Math.random()>0.6}))
fs.writeFileSync(path.join(out,'notifications.json'), JSON.stringify(notifications,null,2))

console.log('Mock data generated in src/data')
