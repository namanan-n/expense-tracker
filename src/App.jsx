
import { useEffect, useState } from 'react'
import {
  PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer
} from 'recharts'
import './App.css'

const initialCategories = [
  { id: '1', name: 'Food', color: '#f59e0b' },
  { id: '2', name: 'Transport', color: '#3b82f6' },
  { id: '3', name: 'Bills', color: '#8b5cf6' },
  { id: '4', name: 'Shopping', color: '#ec4899' },
  { id: '5', name: 'Entertainment', color: '#10b981' },
  { id: '6', name: 'Other', color: '#64748b' }
]

const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function App() {
  const [expenses, setExpenses] = useState(() =>
    JSON.parse(localStorage.getItem('expenses') || '[]')
  )
  const [categories, setCategories] = useState(() =>
    JSON.parse(localStorage.getItem('categories') || 'null') || initialCategories
  )

  const [showForm, setShowForm] = useState(false)
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [date, setDate] = useState(today())
  const [note, setNote] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [newColor, setNewColor] = useState('#0ea5e9')
  const [selectedMonth, setSelectedMonth] = useState(today().slice(0, 7))

  // Save data to localStorage with a short debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('expenses', JSON.stringify(expenses))
      localStorage.setItem('categories', JSON.stringify(categories))
    }, 300)
    return () => clearTimeout(timer)
  }, [expenses, categories])

  function addExpense(e) {
    e.preventDefault()

    if (Number(amount) <= 0 || !category || !date || note.length > 120) {
      alert('Please enter valid details. Amount must be greater than zero.')
      return
    }

    setExpenses([...expenses, {
      id: Date.now(),
      amount: Number(amount),
      category,
      date,
      note
    }])

    setAmount('')
    setCategory('')
    setDate(today())
    setNote('')
    setShowForm(false)
  }

  function deleteExpense(id) {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      setExpenses(expenses.filter(item => item.id !== id))
    }
  }

  function addCategory() {
    if (!newCategory.trim()) {
      alert('Enter a category name')
      return
    }

    if (categories.some(c => c.name.toLowerCase() === newCategory.trim().toLowerCase())) {
      alert('Category already exists')
      return
    }

    setCategories([...categories, {
      id: String(Date.now()),
      name: newCategory.trim(),
      color: newColor
    }])
    setNewCategory('')
  }

  function editCategory(id) {
    const oldCategory = categories.find(c => c.id === id)
    const name = window.prompt('Enter new category name:', oldCategory.name)
    if (!name || !name.trim()) return

    const color = window.prompt('Enter new colour (example: #ff0000):', oldCategory.color)
    if (color && !/^#[0-9a-fA-F]{6}$/.test(color)) {
      alert('Enter a valid hex colour, for example #ff0000')
      return
    }

    setCategories(categories.map(c =>
      c.id === id ? { ...c, name: name.trim(), color: color || c.color } : c
    ))
  }

  function deleteCategory(id) {
    if (expenses.some(e => e.category === id)) {
      alert('This category is being used. Delete or reassign its expenses first.')
      return
    }

    if (window.confirm('Delete this category?')) {
      setCategories(categories.filter(c => c.id !== id))
    }
  }

  const sortedExpenses = [...expenses].sort((a, b) =>
    b.date.localeCompare(a.date)
  )

  const monthExpenses = expenses.filter(e => e.date.startsWith(selectedMonth))
  const total = monthExpenses.reduce((sum, e) => sum + e.amount, 0)

  const now = new Date()
  const currentMonth = today().slice(0, 7)
  const previousDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const previousMonth = `${previousDate.getFullYear()}-${String(previousDate.getMonth() + 1).padStart(2, '0')}`

  const currentTotal = expenses
    .filter(e => e.date.startsWith(currentMonth))
    .reduce((s, e) => s + e.amount, 0)

  const previousTotal = expenses
    .filter(e => e.date.startsWith(previousMonth))
    .reduce((s, e) => s + e.amount, 0)

  const change = previousTotal === 0
    ? null
    : ((currentTotal - previousTotal) / previousTotal) * 100

  const categoryData = categories.map(c => ({
    name: c.name,
    value: monthExpenses
      .filter(e => e.category === c.id)
      .reduce((s, e) => s + e.amount, 0),
    color: c.color
  })).filter(c => c.value > 0)

  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    return {
      month: d.toLocaleString('en-IN', { month: 'short' }),
      total: expenses.filter(e => e.date.startsWith(key))
        .reduce((s, e) => s + e.amount, 0)
    }
  })

  function exportCSV() {
    const rows = [
      ['ID', 'Amount', 'Category', 'Date', 'Note'],
      ...sortedExpenses.map(e => [
        e.id,
        e.amount,
        categories.find(c => c.id === e.category)?.name || 'Unknown',
        e.date,
        e.note
      ])
    ]

    const csv = rows.map(row =>
      row.map(value => `"${String(value ?? '').replace(/"/g, '""')}"`).join(',')
    ).join('\n')

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'expenses.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="app">
      <nav className="navbar">
        <h1>Expense Tracker</h1>
        <button onClick={() => setShowForm(true)}>+ Add Expense</button>
      </nav>

      <main className="main">
        <h2>Dashboard</h2>

        <section className="summary">
          <div className="card">
            <h3>This Month's Spending</h3>
            <h2>₹{currentTotal.toFixed(2)}</h2>
          </div>
          <div className="card">
            <h3>Previous Month</h3>
            <h2>₹{previousTotal.toFixed(2)}</h2>
          </div>
          <div className="card">
            <h3>Monthly Change</h3>
            <h2>{change === null ? 'N/A' : `${change.toFixed(1)}%`}</h2>
            <p>{change === null ? 'No previous-month data' : change > 0 ? 'Spending increased' : 'Spending decreased'}</p>
          </div>
        </section>

        {showForm && (
          <div className="overlay">
            <form className="expense-form" onSubmit={addExpense}>
              <h2>Add New Expense</h2>

              <label>Amount (₹)</label>
              <input type="number" min="0.01" step="0.01"
                value={amount} onChange={e => setAmount(e.target.value)} required />

              <label>Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)} required>
                <option value="">Select category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>

              <label>Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} required />

              <label>Note (maximum 120 characters)</label>
              <textarea maxLength={120} value={note}
                onChange={e => setNote(e.target.value)} />

              <button type="submit">Save Expense</button>
              <button type="button" className="cancel" onClick={() => setShowForm(false)}>Cancel</button>
            </form>
          </div>
        )}

        <section className="panel">
          <h2>Expenses</h2>
          {sortedExpenses.length === 0 ? (
            <div className="empty">
              <h3>No expenses yet!</h3>
              <p>Start tracking your expenses by adding one.</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Amount</th><th>Category</th><th>Date</th><th>Note</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {sortedExpenses.map(e => {
                    const cat = categories.find(c => c.id === e.category)
                    return (
                      <tr key={e.id}>
                        <td>₹{e.amount.toFixed(2)}</td>
                        <td><span className="tag" style={{ background: cat?.color || '#64748b' }}>{cat?.name || 'Unknown'}</span></td>
                        <td>{e.date}</td>
                        <td>{e.note || '-'}</td>
                        <td><button className="delete" onClick={() => deleteExpense(e.id)}>Delete</button></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="panel">
          <h2>Category Management</h2>
          <div className="category-add">
            <input placeholder="New category name" value={newCategory}
              onChange={e => setNewCategory(e.target.value)} />
            <input type="color" value={newColor} onChange={e => setNewColor(e.target.value)} />
            <button onClick={addCategory}>Add Category</button>
          </div>

          {categories.map(c => (
            <div className="category-row" key={c.id}>
              <span><span className="dot" style={{ background: c.color }} />{c.name}</span>
              <div>
                <button onClick={() => editCategory(c.id)}>Edit</button>
                <button className="delete" onClick={() => deleteCategory(c.id)}>Delete</button>
              </div>
            </div>
          ))}
        </section>

        <section className="panel">
          <h2>Monthly Summary and Category Breakdown</h2>
          <label>Select month: </label>
          <input type="month" value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)} />
          <h3>Total: ₹{total.toFixed(2)}</h3>

          {categoryData.length > 0 ? (
            <div className="chart">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={categoryData} dataKey="value" nameKey="name"
                    cx="50%" cy="50%" outerRadius={90} label>
                    {categoryData.map((c, i) => <Cell key={i} fill={c.color} />)}
                  </Pie>
                  <Tooltip formatter={value => `₹${value}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : <p>No expenses for this month.</p>}
        </section>

        <section className="panel">
          <h2>Monthly Trend – Last 6 Months</h2>
          <div className="chart">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyData}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={value => `₹${value}`} />
                <Bar dataKey="total" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <button className="export" onClick={exportCSV}>Export CSV</button>
      </main>
    </div>
  )
}

export default App
