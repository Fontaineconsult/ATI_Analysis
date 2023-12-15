import scrapy
from scrapy.linkextractors import LinkExtractor

class MySpider(scrapy.Spider):
    name = 'myspider'
    allowed_domains = ['example.com']
    start_urls = ['http://example.com']

    custom_settings = {
        # List of file extensions that should be downloaded
        'DOWNLOAD_EXTENSIONS': ['.html', '.htm', '.php', '.asp', '.aspx']
    }

    def parse(self, response):
        search_terms = ['term1', 'term2', 'term3']
        if any(term in response.text for term in search_terms):
            yield {
                'url': response.url,
                'matches': [term for term in search_terms if term in response.text]
            }

        link_extractor = LinkExtractor(schemes=('http', 'https'))
        links = link_extractor.extract_links(response)
        for link in links:
            yield response.follow(link, self.parse)parse)