import requests
URL_BASE = 'https://www.reddit.com'
URL_FORM = URL_BASE + '/r/{}/top.json?t=day'
SUBS = ['rarepuppers']



def get(sub):
    url = URL_FORM.format(sub)
    r = requests.get(url, headers = {'User-agent': 'ForBrzy'})
    data = r.json()['data']['children']
    for i in range(0, 10):
        try:
            data = data[0]['data']
            print(URL_BASE + data['permalink'])
            print(data['url'])
            break
        except:
            pass


if __name__ == '__main__':
    get(SUBS[0])
