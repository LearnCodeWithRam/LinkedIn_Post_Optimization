"""
Tasks for scraping viral LinkedIn posts.
"""

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from selenium.webdriver.chrome.options import Options
import json
import os
import time
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


def scrape_viral_posts_task(
    search_query: str,
    user_id: str = None,
    personalize: bool = True,
    user_role: str = None,
    user_topics: str = None
) -> dict:
    """
    Scrape viral LinkedIn posts based on search query.
    
    Args:
        search_query: The search query for finding posts
        user_id: User ID to fetch personal story (optional)
        personalize: Whether to enable personalized search
        user_role: User's role (for personalization) - auto-fetched if user_id provided
        user_topics: Topics user posts about (for personalization) - auto-fetched if user_id provided
    
    Returns:
        Dictionary with scraping results
    """
    # Fetch personal story if user_id is provided
    if user_id and (user_role is None or user_topics is None):
        try:
            from apps.personal_story.utils import get_user_personal_story, get_scraping_keywords
            
            story_data = get_user_personal_story(user_id)
            
            if story_data:
                # Build user_role from personal story
                if user_role is None:
                    role_parts = []
                    if story_data.get('role'):
                        role_parts.append(f"I am a {story_data['role']}")
                    if story_data.get('industry'):
                        role_parts.append(f"in the {story_data['industry']} industry")
                    if story_data.get('seniority_level'):
                        role_parts.append(f"at {story_data['seniority_level']} level")
                    
                    user_role = ". ".join(role_parts) if role_parts else "I am a professional"
                
                # Build user_topics from personal story
                if user_topics is None:
                    topic_parts = []
                    
                    # Add interests
                    if story_data.get('interests'):
                        interests_str = ", ".join(story_data['interests'])
                        topic_parts.append(f"Interested in: {interests_str}")
                    
                    # Add content topics
                    if story_data.get('content_topics'):
                        topics_str = ", ".join(story_data['content_topics'])
                        topic_parts.append(f"Content focus: {topics_str}")
                    
                    # Add career goals
                    if story_data.get('career_goals'):
                        topic_parts.append(f"Goals: {story_data['career_goals']}")
                    
                    # Add job description
                    if story_data.get('job_description'):
                        topic_parts.append(f"Work: {story_data['job_description']}")
                    
                    user_topics = ". ".join(topic_parts) if topic_parts else "General professional topics"
                
                logger.info(f"Personalization enabled with user story - Role: {user_role[:50]}...")
            else:
                logger.info("No personal story found for user, using defaults")
        except Exception as e:
            logger.warning(f"Failed to fetch personal story: {str(e)}")
    
    # Use defaults if still None
    if user_role is None:
        user_role = "I am a professional"
    if user_topics is None:
        user_topics = "General professional topics and industry trends"
    
    browser = None
    
    try:
        # Configure Chrome options for headless mode (production)
        chrome_options = Options()
        chrome_options.add_argument('--headless')
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--disable-gpu')
        chrome_options.add_argument('--window-size=1920,1080')
        
        # Initialize browser
        browser = webdriver.Chrome(options=chrome_options)
        browser.maximize_window()
        
        logger.info(f"Starting scraping for query: {search_query}")
        
        # Navigate to the page
        browser.get('https://taplio.com/find-viral-linkedin-posts')
        
        # Wait for page to load
        wait = WebDriverWait(browser, 10)
        time.sleep(3)
        
        # Find and fill the search input
        search_input = wait.until(
            EC.presence_of_element_located((By.CSS_SELECTOR, 'input.chakra-input.css-qluo93'))
        )
        search_input.clear()
        search_input.send_keys(search_query)
        time.sleep(1)

        # Handle personalization if enabled
        if personalize:
            try:
                checkbox = browser.find_element(By.CSS_SELECTOR, 'input.chakra-switch__input[id="personalised"]')
                if not checkbox.is_selected():
                    checkbox_label = browser.find_element(By.CSS_SELECTOR, 'label.chakra-switch.css-ghot30')
                    checkbox_label.click()
                    time.sleep(1)
                    
                    input_fields = browser.find_elements(By.CSS_SELECTOR, 'div.chakra-stack.css-di7enk input.chakra-input.css-5ljluq')
                    
                    if len(input_fields) >= 2:
                        if user_role:
                            input_fields[0].clear()
                            input_fields[0].send_keys(user_role)
                        
                        if user_topics:
                            input_fields[1].clear()
                            input_fields[1].send_keys(user_topics)
                        
                        time.sleep(3)
            except NoSuchElementException:
                logger.warning("Personalization checkbox not found")

        # Click the search button
        search_button = browser.find_element(By.CSS_SELECTOR, 'a.chakra-button.css-1hq8tcc')
        search_button.click()
        
        # Wait for posts to load
        logger.info("Waiting for posts to load...")
        
        # Wait for document ready
        WebDriverWait(browser, 30).until(
            lambda driver: driver.execute_script("return document.readyState") == "complete"
        )
        
        # Wait for AJAX to complete
        def wait_for_ajax(driver):
            try:
                jquery_defined = driver.execute_script("return typeof jQuery != 'undefined'")
                if jquery_defined:
                    return driver.execute_script("return jQuery.active == 0")
                return True
            except:
                return True
        
        try:
            WebDriverWait(browser, 10).until(wait_for_ajax)
        except:
            pass
        
        # Wait for loading spinners to disappear
        loading_indicators = ['.chakra-spinner', '[role="status"]', '[data-loading="true"]']
        for selector in loading_indicators:
            try:
                WebDriverWait(browser, 30).until(
                    EC.invisibility_of_element_located((By.CSS_SELECTOR, selector))
                )
            except:
                pass
        
        # Wait for stable content
        def wait_for_stable_content(driver, timeout=20, stable_time=2):
            end_time = time.time() + timeout
            last_count = 0
            stable_checks = 0
            required_stable_checks = int(stable_time / 0.5)
            
            while time.time() < end_time:
                current_count = len(driver.find_elements(By.CSS_SELECTOR, 'div.css-1fl3bno'))
                
                if current_count > 0 and current_count == last_count:
                    stable_checks += 1
                    if stable_checks >= required_stable_checks:
                        return True, current_count
                else:
                    stable_checks = 0
                
                last_count = current_count
                time.sleep(0.5)
            
            return False, last_count
        
        is_stable, post_count = wait_for_stable_content(browser)
        logger.info(f"Content stable with {post_count} posts")
        
        # Verify posts are loaded
        try:
            WebDriverWait(browser, 15).until(
                lambda driver: len([
                    post for post in driver.find_elements(By.CSS_SELECTOR, 'div.css-1fl3bno')
                    if post.find_elements(By.CSS_SELECTOR, 'p.chakra-text.css-14go5ty')
                ]) >= 3
            )
        except TimeoutException:
            logger.warning("Some posts may be incomplete")
        
        # Scrape posts
        posts_data = []
        post_containers = browser.find_elements(By.CSS_SELECTOR, 'div.css-1fl3bno')
        
        for idx, post in enumerate(post_containers):
            try:
                post_info = {}
                
                # Extract author name
                try:
                    author_name = post.find_element(By.CSS_SELECTOR, 'p.chakra-text.css-14go5ty').text
                    if author_name and author_name.strip() and author_name.strip().lower() != 'undefined undefined':
                        post_info['author_name'] = author_name.strip()
                    else:
                        try:
                            author_name_alt = post.find_element(By.CSS_SELECTOR, '.chakra-stack.css-1igwmid p.chakra-text').text
                            post_info['author_name'] = author_name_alt.strip() if author_name_alt else 'Unknown'
                        except:
                            post_info['author_name'] = 'Unknown'
                except NoSuchElementException:
                    post_info['author_name'] = 'Unknown'
                
                # Extract profile image URL
                try:
                    profile_img = post.find_element(By.CSS_SELECTOR, 'img.chakra-avatar__img.css-3a5bz2')
                    post_info['profile_image_url'] = profile_img.get_attribute('src')
                except NoSuchElementException:
                    post_info['profile_image_url'] = None
                
                # Extract time posted
                try:
                    time_posted = post.find_element(By.CSS_SELECTOR, 'p.chakra-text.css-dw5ttn').text
                    post_info['time_posted'] = time_posted
                except NoSuchElementException:
                    post_info['time_posted'] = None
                
                # Extract post content
                try:
                    post_content = post.find_element(By.CSS_SELECTOR, 'p.chakra-text.css-1fphtvc').text
                    post_info['post_content'] = post_content
                except NoSuchElementException:
                    post_info['post_content'] = None
                
                # Extract post image
                try:
                    post_image = post.find_element(By.CSS_SELECTOR, 'img.chakra-image.css-l8vm5j')
                    post_info['post_image_url'] = post_image.get_attribute('src')
                except NoSuchElementException:
                    post_info['post_image_url'] = None
                
                # Extract LinkedIn link
                try:
                    linkedin_link = post.find_element(By.CSS_SELECTOR, 'a[target="_blank"][href*="linkedin.com"]')
                    post_info['linkedin_url'] = linkedin_link.get_attribute('href')
                except NoSuchElementException:
                    post_info['linkedin_url'] = None
                
                # Extract likes count
                try:
                    likes_button = post.find_element(By.CSS_SELECTOR, 'button.chakra-button.css-17dt7b4')
                    post_info['likes'] = likes_button.text
                except NoSuchElementException:
                    post_info['likes'] = None
                
                posts_data.append(post_info)
                logger.info(f"Scraped post {idx + 1}: {post_info.get('author_name', 'Unknown')}")
                
            except Exception as e:
                logger.error(f"Error scraping post {idx + 1}: {str(e)}")
                continue

        
        logger.info(f"Successfully scraped {len(posts_data)} posts")
        
        # Print first post as example
        # if posts_data:
        #     print("\nExample of first post:")
        #     print(json.dumps(posts_data[0], indent=2, ensure_ascii=False))

        json_file_path = os.path.join(os.path.dirname(__file__), 'linkedin_posts.json')

        # Load existing data
        if os.path.exists(json_file_path):
            with open(json_file_path, 'r', encoding='utf-8') as f:
                try:
                    existing_data = json.load(f)
                except json.JSONDecodeError:
                    existing_data = []
        else:
            existing_data = []

        # Ensure existing_data is a list
        if not isinstance(existing_data, list):
            existing_data = [existing_data]

        # Merge scraped posts (list of dicts)
        if isinstance(posts_data, list):
            existing_data.extend(posts_data)
        else:
            existing_data.append(posts_data)

        # Save back
        with open(json_file_path, 'w', encoding='utf-8') as f:
            json.dump(existing_data, f, indent=4, ensure_ascii=False)
                
        print(f"\nSuccessfully scraped {len(posts_data)} posts!")
        print("Data saved to 'linkedin_posts.json'")
        logger.info(f"Successfully Data saved to 'linkedin_posts.json")
        
        # Rebuild vector index for similarity search
        try:
            from apps.check_similarity.tasks import rebuild_vector_index_task
            logger.info("Triggering vector index rebuild...")
            rebuild_result = rebuild_vector_index_task()
            logger.info(f"Vector index rebuild result: {rebuild_result.get('message', 'Unknown')}")
        except Exception as e:
            logger.warning(f"Failed to rebuild vector index: {str(e)}")

        return {
            'success': True,
            'total_posts': len(posts_data),
            'posts': posts_data,
            'search_query': search_query,
            'personalized': personalize,
            'scraped_at': datetime.now().isoformat(),
            'message': f'Successfully scraped {len(posts_data)} viral posts'
        }
    
    except TimeoutException as e:
        logger.error(f"Timeout error: {str(e)}")
        return {
            'success': False,
            'error': 'Timeout: Element not found within the specified time',
            'details': str(e)
        }
    
    except Exception as e:
        logger.error(f"Scraping error: {str(e)}")
        return {
            'success': False,
            'error': f'An error occurred: {str(e)}',
            'details': str(e)
        }
    
    finally:
        if browser:
            try:
                browser.quit()
                logger.info("Browser closed successfully")
            except Exception as e:
                logger.error(f"Error closing browser: {str(e)}")











