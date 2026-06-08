import { ASTAnalyzer } from './index.js'
import { Store, Writer } from 'n3'

/**
 * CLCoverageAnalyzer compatibility layer
 * Delegates to ASTAnalyzer and provides Turtle format export capabilities.
 */
export class CLCoverageAnalyzer {
  constructor(options = {}) {
    this.options = options
    this.astAnalyzer = new ASTAnalyzer(options)
  }

  async analyze(options = {}) {
    return await this.astAnalyzer.analyze(options)
  }

  async formatReport(report, options = {}) {
    const format = options.format || this.options.format || 'text'
    
    if (format.toLowerCase() === 'turtle') {
      const { baseUri = 'http://example.org/cli', cliName = 'cli' } = options
      const timestamp = report.metadata?.analyzedAt || new Date().toISOString()

      const store = new Store()
      const cliUri = `${baseUri}/${cliName}`
      
      store.addQuad(cliUri, 'rdf:type', 'cli:Application')
      store.addQuad(cliUri, 'rdfs:label', cliName)
      store.addQuad(cliUri, 'cli:analyzedAt', `"${timestamp}"^^xsd:dateTime`)
      
      const overall = report.coverage?.summary?.overall || { percentage: 0 }
      store.addQuad(
        cliUri,
        'coverage:overallCoverage',
        `"${overall.percentage.toFixed(1)}"^^xsd:decimal`
      )

      const writer = new Writer({ format: 'Turtle' })
      return new Promise((resolve, reject) => {
        writer.addQuads(store.getQuads())
        writer.end((error, result) => {
          if (error) {
            reject(error)
          } else {
            resolve(result)
          }
        })
      })
    }
    
    return JSON.stringify(report, null, 2)
  }
}
