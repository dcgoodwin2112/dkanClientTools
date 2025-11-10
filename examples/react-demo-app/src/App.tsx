import DatasetList from './components/DatasetList'
import './App.css'

function App() {
  return (
    <div className="app">
      <header>
        <h1>DKAN Client Tools - React Demo</h1>
        <p>Demonstrating @dkan-client-tools/react package</p>
      </header>
      <main>
        <DatasetList />
      </main>
    </div>
  )
}

export default App
