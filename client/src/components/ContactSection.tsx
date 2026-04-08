import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Mail, Phone, Globe, MapPin, Star } from 'lucide-react';
import { useLanguage } from '@/lib/language-context';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2 } from 'lucide-react';

export default function ContactSection() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSentPopup, setShowSentPopup] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [hoveredRating, setHoveredRating] = useState(0);
  const [userRating, setUserRating] = useState(0);

  const queryClient = useQueryClient();

  const { data: ratingData } = useQuery({
    queryKey: ['ratings'],
    queryFn: async () => {
      const res = await fetch('/api/ratings');
      return res.json();
    }
  });

  const submitRating = useMutation({
    mutationFn: async (rating: number) => {
      const res = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating })
      });
      if (!res.ok) throw new Error('Failed to submit rating');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ratings'] });
      toast({
        title: "Success",
        description: "Thank you for your rating!",
      });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        setShowSentPopup(true);
        window.setTimeout(() => setShowSentPopup(false), 2500);
        toast({
          title: t.contact.success,
          description: `Thank you, ${formData.name}! We'll get back to you soon.`,
        });
        setFormData({ name: '', email: '', message: '' });
      } else {
        toast({
          title: 'Error',
          description: result.message || 'Something went wrong. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Network error. Please check your connection and try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      id="contact"
      className="py-20 lg:py-28 bg-background"
      data-testid="contact-section"
    >
      {showSentPopup && (
        <div className="fixed top-6 right-6 z-50">
          <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-4 py-2 text-sm font-medium text-green-700 shadow-lg">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <span>Your message has been sent</span>
          </div>
        </div>
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-heading text-4xl lg:text-5xl font-bold text-foreground mb-4">
            {t.contact.title}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t.contact.subtitle}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          <Card className="overflow-visible">
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                    {t.contact.name}
                  </label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full"
                    data-testid="input-name"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                    {t.contact.email}
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="w-full"
                    data-testid="input-email"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
                    {t.contact.message}
                  </label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                    rows={5}
                    className="w-full resize-none"
                    data-testid="input-message"
                  />
                </div>



                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                  data-testid="button-send-message"
                >
                  {isSubmitting ? t.contact.sending : t.contact.send}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-8">
            <div>
              <h3 className="font-heading text-xl font-semibold text-foreground mb-4">
                {t.contact.rateUs || 'Rate Us!'}
              </h3>
              <div className="flex flex-col gap-2 mb-8">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={`focus:outline-none transition-transform ${userRating > 0 ? 'cursor-default opacity-80' : 'hover:scale-110'}`}
                      onMouseEnter={() => !userRating && setHoveredRating(star)}
                      onMouseLeave={() => !userRating && setHoveredRating(0)}
                      onClick={() => {
                        if (userRating === 0) {
                          setUserRating(star);
                          submitRating.mutate(star);
                        }
                      }}
                      disabled={submitRating.isPending || userRating > 0}
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= (hoveredRating || userRating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-muted-foreground'
                        } transition-colors`}
                      />
                    </button>
                  ))}
                </div>
                {ratingData && (
                  <div className="text-sm text-muted-foreground">
                    <span className="font-bold text-foreground mr-1">{ratingData.average || 0}</span>
                    {t.contact.averageRating || 'Average Rating'} ({ratingData.count || 0} {t.contact.ratingsCount || 'ratings'})
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-heading text-xl font-semibold text-foreground mb-6">
                {t.contact.companyInfo}
              </h3>

              <div className="space-y-4">
                <a
                  href="https://www.poptum.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="link-website"
                >
                  <Globe className="w-5 h-5 text-primary" />
                  <span>www.poptum.in</span>
                </a>

                <a
                  href="mailto:info.poptum@gmail.com"
                  className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="link-email"
                >
                  <Mail className="w-5 h-5 text-primary" />
                  <span>info.poptum@gmail.com</span>
                </a>

                <div className="flex items-start gap-3 text-muted-foreground">
                  <Phone className="w-5 h-5 text-primary mt-0.5" />
                  <div className="space-y-1">
                    <p>+91 9601061178</p>
                    <p>+49 15510542629</p>
                    <p>+49 15209498862</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-heading font-semibold text-foreground mb-2">
                  {t.contact.manufactured}
                </h4>
                <div className="flex items-start gap-3 text-muted-foreground">
                  <MapPin className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-sm">
                    Tirhuthwala Innovations Pvt. Ltd.<br />
                    Samastipur, Bihar 848132 (India)
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-heading font-semibold text-foreground mb-2">
                  {t.contact.marketed}
                </h4>
                <div className="flex items-start gap-3 text-muted-foreground">
                  <MapPin className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-sm">
                    Moforce Exim, C-3-6, Radha Park,<br />
                    B/H White House, Kalavad Road,<br />
                    Rajkot 360005 (India)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
