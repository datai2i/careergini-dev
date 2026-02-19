"""
LinkedIn Profile Scraper using Playwright
Extracts public profile data from LinkedIn URLs
"""
import re
import logging
import asyncio
from typing import Dict, Any, Optional
from bs4 import BeautifulSoup
from playwright.async_api import async_playwright

logger = logging.getLogger(__name__)

class LinkedInScraper:
    """Scrapes public LinkedIn profile data using headless browser"""
    
    def __init__(self):
        pass
    
    def validate_url(self, url: str) -> bool:
        """Validate LinkedIn profile URL format"""
        pattern = r'https?://(www\.)?linkedin\.com/in/[\w-]+'
        return bool(re.match(pattern, url))
    
    def extract_username(self, url: str) -> Optional[str]:
        """Extract username from LinkedIn URL"""
        match = re.search(r'linkedin\.com/in/([\w-]+)', url)
        return match.group(1) if match else None
    
    async def scrape_profile(self, url: str) -> Dict[str, Any]:
        """
        Scrape LinkedIn profile data from public URL using Playwright
        """
        if not self.validate_url(url):
            raise ValueError("Invalid LinkedIn profile URL")
        
        async with async_playwright() as p:
            # Use a realistic browser context
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(
                user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                viewport={'width': 1920, 'height': 1080},
                locale='en-US'
            )
            
            page = await context.new_page()
            
            try:
                logger.info(f"Navigating to LinkedIn profile: {url}")
                await page.goto(url, timeout=30000, wait_until='domcontentloaded')
                
                # Wait a bit for dynamic content
                await asyncio.sleep(2)
                
                # Check for authwall
                content = await page.content()
                if "authwall" in page.url or "Sign In" in content:
                    logger.warning("Hit LinkedIn authwall or login page")
                    # Try to close potential modal if it exists (sometimes works)
                    try:
                        await page.click('button[aria-label="Dismiss"]', timeout=2000)
                        await asyncio.sleep(1)
                    except:
                        pass
                
                # Get page content after JS execution
                html_content = await page.content()
                soup = BeautifulSoup(html_content, 'html.parser')
                
                # Extract data
                profile_data = self._extract_from_soup(soup)
                
                # Add source URL
                profile_data['source_url'] = url
                profile_data['username'] = self.extract_username(url)
                
                if not profile_data.get('name') and not profile_data.get('headline'):
                     logger.warning("Scraping yielded minimal data. Profile might be private.")
                
                return profile_data
                
            except Exception as e:
                logger.error(f"Playwright scraping failed: {e}")
                raise Exception(f"Failed to access LinkedIn profile: {str(e)}")
            finally:
                await browser.close()
    
    def _extract_from_soup(self, soup: BeautifulSoup) -> Dict[str, Any]:
        """Extract data using BS4 from rendered HTML"""
        data = {}
        
        # 1. Try Meta Tags (OpenGraph) - Most reliable for public profiles
        og_title = soup.find('meta', property='og:title')
        if og_title and og_title.get('content'):
            title_content = og_title.get('content', '').strip()
            # Remove " | LinkedIn" suffix
            data['name'] = title_content.replace(' | LinkedIn', '').strip()
            
        og_desc = soup.find('meta', property='og:description')
        if og_desc and og_desc.get('content'):
            data['headline'] = og_desc.get('content', '').strip()
            
        og_image = soup.find('meta', property='og:image')
        if og_image and og_image.get('content'):
            data['profile_image'] = og_image.get('content', '')

        # 2. Try Standard Selectors (if allowed to view full profile)
        if not data.get('name'):
            name_elem = soup.select_one('h1.top-card-layout__title, h1.text-heading-xlarge, .top-card__title')
            if name_elem:
                data['name'] = name_elem.get_text(strip=True)
        
        if not data.get('headline'):
             headline_elem = soup.select_one('.top-card-layout__headline, .text-body-medium, .top-card__headline')
             if headline_elem:
                 data['headline'] = headline_elem.get_text(strip=True)
                 
        # 3. Try to get About/Summary
        summary_elem = soup.select_one('.core-section-container[data-section="summary"] .inline-show-more-text, .about-section .description')
        if summary_elem:
            data['summary'] = summary_elem.get_text(strip=True)
            
        return data

    def parse_to_standard_format(self, scraped_data: Dict[str, Any]) -> Dict[str, Any]:
        """Convert scraped data to standard profile format"""
        result = {
            'name': scraped_data.get('name', ''),
            'headline': scraped_data.get('headline', ''),
            'location': scraped_data.get('location', ''),
            'summary': scraped_data.get('summary', scraped_data.get('headline', '')),
            'profile_image': scraped_data.get('profile_image', ''),
            'skills': [], # Hard to get from public view without full render
            'experience': [],
            'education': [],
            'source': 'linkedin',
            'source_url': scraped_data.get('source_url', ''),
        }
        
        if not result['name']:
             result['note'] = "Could not extract profile Name. Profile might be private."
        
        return result

async def scrape_linkedin_profile(url: str) -> Dict[str, Any]:
    """
    Main async function to scrape and parse LinkedIn profile
    """
    scraper = LinkedInScraper()
    scraped_data = await scraper.scrape_profile(url)
    return scraper.parse_to_standard_format(scraped_data)
