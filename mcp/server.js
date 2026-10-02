#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import { APP_VERSION } from '../src/version.js'
import { beregnBilletter, beregnSkjema, forslag, helligdager, lesIcs } from './verktoy.js'

const svar = (data) => ({ content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] })

const server = new McpServer({ name: 'pendlerkalkulator', version: APP_VERSION })

server.registerTool(
  'beregn_billetter',
  {
    description:
      'Finner billigste kombinasjon av enkelt-, 7-, 30- og 365-dagersbilletter for en man–fre-pendling, med aktivering/utløp, alternativer og årskort-vurdering.',
    inputSchema: beregnSkjema,
  },
  async (inn) => svar(beregnBilletter(inn)),
)

server.registerTool(
  'hent_forslag',
  { description: 'Vys voksenpriser (til Oslo S) for kjente strekninger, som utgangspunkt for beregn_billetter.', inputSchema: {} },
  async () => svar(forslag()),
)

server.registerTool(
  'helligdager',
  {
    description: 'Norske fridager for et år, pluss mandag–onsdag i påskeuka.',
    inputSchema: { aar: z.number().int().min(1900).max(2200) },
  },
  async (inn) => svar(helligdager(inn)),
)

server.registerTool(
  'les_ics',
  {
    description: 'Leser en .ics-kalender og returnerer heldagshendelser som sammenslått ferie.',
    inputSchema: { tekst: z.string().describe('Innholdet i .ics-filen') },
  },
  async (inn) => svar(lesIcs(inn)),
)

await server.connect(new StdioServerTransport())
