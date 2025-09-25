/**
 * Data export utilities for trades
 */

export const formatDate = (dateString) => {
  if (!dateString) {return ''}
  const date = new Date(dateString)
  return date.toISOString().split('T')[0] // YYYY-MM-DD format
}

export const calculateMetrics = (trade) => {
  const entryPrice = parseFloat(trade.entryPrice) || 0
  const exitPrice = parseFloat(trade.exitPrice) || 0
  const quantity = parseFloat(trade.quantity) || 0
  const fees = parseFloat(trade.fees) || 0
  
  const positionSize = entryPrice * quantity
  const grossPnL = (exitPrice - entryPrice) * quantity
  const netPnL = grossPnL - fees
  const pnlPercentage = positionSize > 0 ? (netPnL / positionSize) * 100 : 0
  
  return {
    positionSize: positionSize.toFixed(2),
    grossPnL: grossPnL.toFixed(2),
    netPnL: netPnL.toFixed(2),
    pnlPercentage: pnlPercentage.toFixed(2)
  }
}

export const exportToCSV = (trades) => {
  if (!trades || trades.length === 0) {
    throw new Error('No trades to export')
  }
  
  const headers = [
    'Date',
    'Symbol',
    'Contract',
    'Trade Type',
    'Entry Date',
    'Exit Date',
    'Entry Price',
    'Exit Price',
    'Quantity',
    'Position Size',
    'Fees',
    'Gross P&L',
    'Net P&L',
    'P&L %',
    'Strategy',
    'Confidence',
    'Notes',
    'Remarks',
    'Lessons'
  ]
  
  const csvContent = [
    headers.join(','),
    ...trades.map(trade => {
      const metrics = calculateMetrics(trade)
      return [
        formatDate(trade.createdAt),
        `"${trade.symbol || ''}"`,
        `"${trade.contract || ''}"`,
        `"${trade.tradeType || ''}"`,
        formatDate(trade.entryDate),
        formatDate(trade.exitDate),
        trade.entryPrice || '',
        trade.exitPrice || '',
        trade.quantity || '',
        metrics.positionSize,
        trade.fees || '0',
        metrics.grossPnL,
        metrics.netPnL,
        metrics.pnlPercentage,
        `"${trade.strategy || ''}"`,
        trade.confidence || '',
        `"${(trade.notes || '').replace(/"/g, '""')}"`,
        `"${(trade.remarks || '').replace(/"/g, '""')}"`,
        `"${(trade.lessons || '').replace(/"/g, '""')}"`,
      ].join(',')
    })
  ].join('\n')
  
  return csvContent
}

export const exportToJSON = (trades) => {
  if (!trades || trades.length === 0) {
    throw new Error('No trades to export')
  }
  
  const exportData = {
    exportDate: new Date().toISOString(),
    version: '1.0',
    totalTrades: trades.length,
    trades: trades.map(trade => ({
      ...trade,
      metrics: calculateMetrics(trade)
    }))
  }
  
  return JSON.stringify(exportData, null, 2)
}

export const downloadFile = (content, filename, mimeType = 'text/plain') => {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  // Clean up the URL object
  setTimeout(() => URL.revokeObjectURL(url), 100)
}

export const generateFileName = (prefix, format) => {
  const now = new Date()
  const timestamp = now.toISOString().slice(0, 19).replace(/[:\-T]/g, '')
  return `${prefix}_${timestamp}.${format}`
}