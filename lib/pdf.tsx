import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'
import type { FilledTemplate } from '@/lib/generator'
import path from 'path'

Font.register({
  family: 'Roboto',
  fonts: [
    { src: path.join(process.cwd(), 'public/fonts/Roboto-Regular.ttf'), fontWeight: 'normal' },
    { src: path.join(process.cwd(), 'public/fonts/Roboto-Bold.ttf'), fontWeight: 'bold' },
  ],
})

const styles = StyleSheet.create({
  page: { padding: 60, fontSize: 11, fontFamily: 'Roboto', lineHeight: 1.6 },
  title: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 24 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', marginTop: 16, marginBottom: 4 },
  content: { fontSize: 11, color: '#333' },
  watermark: {
    position: 'absolute' as const,
    top: '40%' as const,
    left: '10%' as const,
    fontSize: 48,
    color: '#e0e0e0',
    opacity: 0.4,
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
          <View key={section.id}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.content}>{section.content}</Text>
          </View>
        ))}
      </Page>
    </Document>
  )
}
