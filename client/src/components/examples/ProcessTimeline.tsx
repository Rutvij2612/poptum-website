import ProcessTimeline from '../ProcessTimeline';
import { LanguageProvider } from '@/lib/language-context';

export default function ProcessTimelineExample() {
  return (
    <LanguageProvider>
      <ProcessTimeline />
    </LanguageProvider>
  );
}
