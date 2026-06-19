import { TestBed } from '@angular/core/testing';
import { Meta, Title } from '@angular/platform-browser';
import { SeoService } from './seo.service';

describe('SeoService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  afterEach(() => TestBed.resetTestingModule());

  it('updates title, description, canonical, and social metadata', () => {
    const service = TestBed.inject(SeoService);
    const title = TestBed.inject(Title);
    const meta = TestBed.inject(Meta);

    service.setPage({
      title: 'Sobi Mask Recipe',
      description: 'Sobi Mask crafting details.',
      path: '/items/sobi-mask',
      image: '/icons/BTNSobiMask.png'
    });

    expect(title.getTitle()).toBe('Sobi Mask Recipe | DalaranSiege');
    expect(meta.getTag("name='description'")?.content).toBe('Sobi Mask crafting details.');
    expect(meta.getTag("property='og:url'")?.content).toBe('https://dalaran-siege.vercel.app/items/sobi-mask');
    expect(document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href)
      .toBe('https://dalaran-siege.vercel.app/items/sobi-mask');
  });

  it('marks private utility pages as noindex', () => {
    const service = TestBed.inject(SeoService);
    const meta = TestBed.inject(Meta);

    service.setPage({
      title: 'Login',
      description: 'Login page.',
      path: '/auth',
      noIndex: true
    });

    expect(meta.getTag("name='robots'")?.content).toBe('noindex, nofollow');
  });
});
