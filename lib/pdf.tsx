import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'
import type { FilledTemplate } from '@/lib/generator'
import path from 'path'

Font.register({
  family: 'Roboto',
  fonts: [
    {
      src: path.join(process.cwd(), 'public/fonts/Roboto-Regular.ttf'),
      fontWeight: 'normal',
    },
    {
      src: path.join(process.cwd(), 'public/fonts/Roboto-Bold.ttf'),
      fontWeight: 'bold',
    },
  ],
})

const styles = StyleSheet.create({
  page: {
    padding: 60,
    fontSize: 11,
    fontFamily: 'Roboto',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 28,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  line: {
    fontSize: 11,
    marginBottom: 3,
  },
  watermark: {
    position: 'absolute',
    top: '38%',
    left: '5%',
    fontSize: 52,
    color: '#d0d0d0',
    opacity: 0.35,
    transform: 'rotate(-30deg)' as any,
  },
})

type Props = {
  doc: FilledTemplate
  watermark?: boolean
}

export function ClausifyDocument({ doc, watermark = false }: Props) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {watermark && <Text style={styles.watermark}>CLAUSIFY DEMO</Text>}
        <Text style={styles.title}>{doc.title}</Text>
        {doc.sections.map(section => (
          <View key={section.id} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.content.split('\n').map((line, i) => (
              <Text key={i} style={styles.line}>{line}</Text>
            ))}
          </View>
        ))}
      </Page>
    </Document>
  )
}
