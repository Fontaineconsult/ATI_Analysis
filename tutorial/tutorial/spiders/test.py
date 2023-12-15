import scrapy
from scrapy.linkextractors import LinkExtractor
from scrapy import signals
from pydispatch import dispatcher
import re

class MySpider(scrapy.Spider):
    name = 'myspider'
    allowed_domains = ['at.sfsu.edu']
    start_urls = ['https://at.sfsu.edu']

    custom_settings = {
        'DOWNLOAD_EXTENSIONS': ['.html', '.htm', '.php', '.asp', '.aspx']
    }

    def __init__(self):
        self.matched_links = []  # Store matched links
        dispatcher.connect(self.spider_closed, signals.spider_closed)  # Connect the spider_closed method to the spider_closed signal

    def parse(self, response):
        search_terms = ['accessible', 'accessibility', 'Disability', 'disability', 'disabled', 'Disabled']
        main_content = response.xpath('//div[@role="main"]').get()

        # Regular expression pattern for URLs within access.sfsu.edu domain
        url_pattern = re.compile(r'https?://access\.sfsu\.edu/.*')

        if main_content:
            matched_terms = [term for term in search_terms if term in main_content]
            if matched_terms:
                # Find all URLs in the main content
                urls = url_pattern.findall(main_content)
                for url in urls:
                    matched_link = {
                        'source_url': response.url,
                        'match_terms': matched_terms,
                        'match_url': url
                    }
                    self.matched_links.append(matched_link)
                    yield matched_link

        link_extractor = LinkExtractor()
        links = link_extractor.extract_links(response)
        for link in links:
            yield response.follow(link, self.parse)

    def spider_closed(self, spider):
        # Print all matched links when the spider closes
        print("Matched Links:")
        for link in self.matched_links:
            print(link)