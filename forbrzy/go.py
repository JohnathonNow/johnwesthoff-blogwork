import requests

URL_FORM = 'https://www.reddit.com/r/{}/top.json?t=day'
SUBS = ['rarepuppers']



def get(sub):
    url = URL_FORM.format(sub)
    r = requests.get(url, headers = {'User-agent': 'ForBrzy'})
    data = r.json()['data']['children']
    for i in range(0, 10):
        try:
            print(data[0]['data']['url'])
            break
        except:
            pass


if __name__ == '__main__':
    get(SUBS[0])
