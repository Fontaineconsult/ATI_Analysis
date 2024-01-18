import scrapy
from scrapy.linkextractors import LinkExtractor
from scrapy import signals
from pydispatch import dispatcher
import re,sys

sys.path.append(r'C:\Users\913678186\IdeaProjects\ATI_Analysis')
sys.path.append(r'C:\Users\DanielPC\Desktop\Servers\ATI_Analysis')

from schema import get_connection, Webpage


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

        main_div = response.xpath('//div[@role="main"]')

        # Regular expression pattern for URLs within access.sfsu.edu domain
        url_pattern = re.compile(r'https?://access\.sfsu\.edu/.*')

        if main_div:

            # Extract URLs from href attributes within the main div
            extracted_links = main_div.css('a::attr(href)').getall()

            # Filter links that match the URL pattern
            for link in extracted_links:
                absolute_url = response.urljoin(link)
                if url_pattern.match(absolute_url):
                    matched_link = {
                        'source_url': response.url,

                        'match_url': absolute_url
                    }
                    self.matched_links.append(matched_link)
                    yield matched_link

        link_extractor = LinkExtractor()
        links = link_extractor.extract_links(response)
        for link in links:
            yield response.follow(link, self.parse)

    def spider_closed(self, spider):
        graph_connection = get_connection()
        rels = []
        # Print Cypher queries at the end
        print("Processing and adding to Neo4j:")
        for link in self.matched_links:
            source_url = link['source_url']
            match_url = link['match_url']

            rels.append(
                f"{source_url} --> {match_url}"
            )
            # Create or get existing nodes
            source_page = Webpage.match(graph_connection, source_url).first() or Webpage()
            reference_page = Webpage.match(graph_connection, match_url).first() or Webpage()
            source_page.url = source_url
            reference_page.url = match_url

            # Add relationship
            source_page.references.add(reference_page)

            # Merge (create or match) nodes and relationships
            graph_connection.merge(source_page)
            graph_connection.merge(reference_page)

        for each in rels:
            print(each)
