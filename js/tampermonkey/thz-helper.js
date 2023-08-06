// ==UserScript==
// @name         thz-helper
// @description  thz forum helper
// @namespace    http://tampermonkey.net/
// @version      1.0
// @author       paso
// @match        http://96thz.cc/*
// @match        http://www.example.com/
// @grant        none
// @license      MIT
// ==/UserScript==

;(function () {
  'use strict'
  // Your code here...
  // http://96thz.cc/forum.php?mod=forumdisplay&fid=181&filter=typeid&typeid=36&orderby=heats&page=2

  const namespace = 'paso-thz-helper'
  const __msgType = `${namespace}-cross-origin-storage`
  const middleware = 'http://www.example.com'
  if (window.location.origin === middleware) {
    StorageServer()
  } else {
    handleTarget(middleware)
  }

  function handleTarget(server) {
    const DEFAULT_DATA = function () {
      return {
        executeSelector: '#discuz_tips',
        path: '/forum.php',
        params: {
          fid: '181',
          filter: 'typeid',
          typeid: '',
          orderby: 'heats'
        },
        search: ''
      }
    }
    const CONTEXT = {
      env: 'prod',
      dev: {
        dependency: {
          jquery: 'http://localhost:3000/test/jquery.slim.min.js',
          popupInject: 'http://localhost:3000/test/popup-inject.min.js',
          vue: 'http://localhost:3000/test/vue.global.prod.min.js'
        }
      },
      prod: {
        dependency: {
          jquery: 'https://lf9-cdn-tos.bytecdntp.com/cdn/expire-1-M/jquery/3.6.0/jquery.slim.min.js',
          popupInject: 'https://fastly.jsdelivr.net/gh/pansong291/js-lib@v1.0.3/src/popup-inject.min.js',
          vue: 'https://lf6-cdn-tos.bytecdntp.com/cdn/expire-1-M/vue/3.2.31/vue.global.prod.min.js'
        }
      }
    }
    const storage = StorageClient(server)

    const POPUP_INJECT_CONFIG = {
      namespace,
      actionName: 'Settings',
      collapse: '70%',
      location: '35%',
      content: `<div id="${namespace}-app"></div>`,
      style: `
  <style>
  .${namespace} * {
      font-size: 14px;
      color: black;
  }
  .${namespace} .table {
      display: table;
      border-collapse: separate;
      border-spacing: 4px 4px;
  }
  .${namespace} .table-row {
      display: table-row;
  }
  .${namespace} .table-cell {
      display: table-cell;
  }
  .${namespace} .text-right {
      text-align: right;
  }
  .${namespace} .flex.gap-8 {
      gap: 8px;
  }
  </style>`
    }

    const VUE_COMPONENT_PARAM_SELECT = {
      template: `
  <label class="table-row">
      <div class="table-cell text-right">{{title}}</div>
      <div class="table-cell">
          <div class="flex">
            <input class="input monospace" v-if="!hideInput" v-model.trim="inputValue" />
            <select class="input" v-if="!hideSelect" v-model="inputValue">
                <option v-for="o in options" :value="o.value">{{o.label}}</option>
            </select>
          </div>
      </div>
  </label>`,
      props: ['title', 'value', 'options', 'hideInput', 'hideSelect'],
      emits: ['update:value'],
      computed: {
        inputValue: {
          get() {
            return this.$props.value
          },
          set(v) {
            this.$emit('update:value', v)
          }
        }
      }
    }

    const VUE_APP_CONFIG = {
      template: `
  <div class="flex col gap-8">
      <div class="table">
          <SelectFormItem title="执行时机" v-model:value="executeSelector" hideSelect="true" />
          <SelectFormItem title="path" v-model:value="path" hideSelect="true" />
          <SelectFormItem title="板块" v-model:value="params.fid" :options="forms.fidOptions" />
          <SelectFormItem title="筛选" v-model:value="params.filter" :options="forms.filterOptions" hideInput="true" />
          <SelectFormItem title="系列" v-if="params.filter === 'typeid'" v-model:value="params.typeid" :options="forms.typeidOptions" />
          <SelectFormItem title="排序" v-model:value="params.orderby" :options="forms.orderbyOptions" hideInput="true" />
          <SelectFormItem title="搜索" v-model:value="search" hideSelect="true" />
      </div>
      <button class="button" @click="apply">应用</button>
  </div>`,
      components: {
        SelectFormItem: VUE_COMPONENT_PARAM_SELECT
      },
      data() {
        return {
          ...DEFAULT_DATA(),
          forms: {
            fidOptions: [{ value: '181', label: '亚洲無碼原創' }],
            filterOptions: [{ value: 'typeid', label: '系列' }],
            typeidOptions: [
              { value: '', label: '全部' },
              { value: '35', label: '一本道' },
              { value: '36', label: '加勒比' },
              { value: '37', label: '东京热' },
              { value: '37', label: 'HEYZO' },
              { value: '664', label: 'FC2PPV' },
              { value: '770', label: '麻豆传媒' }
            ],
            orderbyOptions: [
              { value: 'heats', label: '最热' },
              { value: 'lastpost', label: '最新' },
              { value: 'dateline', label: '时间' }
            ]
          }
        }
      },
      computed: {},
      methods: {
        apply() {
          storage
            .setItem(namespace, {
              executeSelector: this.executeSelector,
              path: this.path,
              params: {
                ...this.params
              },
              search: this.search
            })
            .then(() => (window.location = getPageLocation(this.path, this.params, '1')))
        }
      },
      mounted() {
        storage
          .getItem(namespace)
          .then((resp) => JSON.parse(resp.data))
          .catch(() => DEFAULT_DATA())
          .then((data) => {
            this.executeSelector = data.executeSelector
            this.path = data.path
            this.params.fid = data.params.fid
            this.params.filter = data.params.filter
            this.params.typeid = data.params.typeid
            this.params.orderby = data.params.orderby
            this.search = data.search
          })
      }
    }

    const dependency = CONTEXT[CONTEXT.env].dependency
    const window$ = window.$
    loadJS(dependency.jquery)
      .then(() => {
        window.$ = window$
      })
      .then(() => loadJS(dependency.popupInject))
      .then(() => loadJS(dependency.vue))
      .then(() => window.paso.injectPopup(POPUP_INJECT_CONFIG))
      .then(() => window.Vue.createApp(VUE_APP_CONFIG).mount(`#${namespace}-app`))

    storage
      .getItem(namespace)
      .then((resp) => JSON.parse(resp.data))
      .catch((e) => {
        return DEFAULT_DATA()
      })
      .then((data) =>
        ready(data.executeSelector)
          .then(() => handlePageContent(data))
          .catch((e) => {
            console.warn(e)
          })
      )

    function handlePageContent(data) {
      // 隐藏广告
      const list = document.querySelectorAll(
        '.a_fl, .a_fr, #toptb + div[align=center], #diynavtop, #toptb, #hd, #ft, #f_pst, #newspecial, #autopbn'
      )
      list?.forEach((el) => {
        el.setAttribute('style', 'display: none !important;')
      })
      // 替换分页
      const { path, params, search } = data
      document.querySelectorAll('#fd_page_bottom > .pg, #fd_page_top > .pg')?.forEach((pw) => {
        const strong = pw.querySelector('strong')
        let currentPage = 1
        if (strong) {
          currentPage = getStartInt(strong.innerText)
        }
        pw.querySelectorAll('a[href]')?.forEach((page) => {
          const pageNum = getEndInt(page.innerText)
          if (isNaN(pageNum)) {
            if (page.classList.contains('prev')) {
              page.href = getPageLocation(path, params, currentPage - 1)
            } else if (page.classList.contains('nxt')) {
              page.href = getPageLocation(path, params, currentPage + 1)
            }
          } else {
            page.href = getPageLocation(path, params, pageNum)
          }
        })
        const pageInput = pw.querySelector('input[name=custompage]')
        if (pageInput) {
          pageInput.onkeydown = function (event) {
            if (event.keyCode === 13) {
              window.location = getPageLocation(path, params, this.value)
              window.doane?.(event)
            }
          }
        }
      })
      // 过滤结果
      const notMatch = []
      const match = (t) => {
        return t && t.indexOf && t.indexOf(search) >= 0
      }
      document.querySelectorAll('#threadlisttableid > tbody')?.forEach((item) => {
        if (!match(item.querySelector('a.s.xst')?.innerText)) {
          notMatch.push(item)
        }
      })
      const setFilter = (filter) => {
        notMatch.forEach((item) => {
          if (filter) {
            item.setAttribute('style', 'display: none !important;')
          } else {
            item.removeAttribute('style')
          }
        })
      }
      // 增加过滤按钮
      const tf = document.querySelector('#threadlist .tf')
      if (tf) {
        let filterCb = tf.querySelector(`label input.${namespace}`)
        if (!filterCb) {
          filterCb = document.createElement('input')
          filterCb.classList.add(namespace)
          filterCb.type = 'checkbox'
          const label = document.createElement('label')
          label.append(filterCb, document.createTextNode('过滤'))
          tf.append(document.createTextNode('\xA0'), label)
        }
        filterCb.checked = !!search
        if (search) setFilter(true)
        filterCb.onchange = (e) => {
          setFilter(e.target.checked)
        }
      }
    }
  }

  function loadJS(src) {
    return new Promise((resolve) => {
      const script = document.createElement('script')
      script.src = src
      script.onload = resolve
      document.head.append(script)
    })
  }

  function ready(selector, interval = 300, timeout = 3000) {
    return new Promise((resolve, reject) => {
      const loopId = setInterval(
        (startTime) => {
          if (document.querySelector(selector)) {
            clearInterval(loopId)
            resolve()
          } else {
            if (Date.now() - startTime > timeout) {
              clearInterval(loopId)
              reject(`look up for target '${selector}' timeout: ${timeout}ms`)
            }
          }
        },
        interval,
        Date.now()
      )
    })
  }

  function getStartInt(str) {
    let result = ''
    if (str) {
      for (let i = 0; i < str.length; i++) {
        if (isNaN(parseInt(str[i]))) {
          if (result) break
        } else {
          result += str[i]
        }
      }
    }
    return parseInt(result)
  }

  function getEndInt(str) {
    let result = ''
    if (str) {
      for (let i = str.length - 1; i >= 0; i--) {
        if (isNaN(parseInt(str[i]))) {
          if (result) break
        } else {
          result = str[i] + result
        }
      }
    }
    return parseInt(result)
  }

  function getPageLocation(path, p, num) {
    const params = {
      mod: 'forumdisplay',
      fid: p.fid || '',
      filter: p.filter || '',
      typeid: p.typeid || '',
      orderby: p.orderby || '',
      page: num
    }
    const paramStr =
      '?' +
      Object.entries(params)
        .map((entry) => {
          return `${entry[0]}=${entry[1]}`
        })
        .join('&')
    return path + paramStr
  }

  /**
   * 生成随机ID
   */
  function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0,
        v = c === 'x' ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
  }

  function StorageClient(middlewareUrl) {
    const _requests = {} //所有请求消息数据映射
    const _cache = {
      ready: false,
      queue: []
    }
    //获取 iframe window 对象
    const _iframeWin = _createIframe(middlewareUrl).contentWindow
    _initListener() //监听

    /**
     * 创建 iframe 标签
     * @param {string} middlewareUrl
     * @return Object
     */
    function _createIframe(middlewareUrl) {
      const iframe = document.createElement('iframe')
      iframe.src = middlewareUrl
      iframe.setAttribute('style', 'display: none !important;')
      window.document.body.appendChild(iframe)
      return iframe
    }

    /**
     * 初始化监听函数
     */
    function _initListener() {
      // 监听 iframe “中转页面”返回的消息
      window.addEventListener('message', (e) => {
        if (e?.data?.__msgType !== __msgType) return
        if (e.data.ready) {
          _cache.ready = true
          while (_cache.queue.length) {
            _iframeWin.postMessage(_cache.queue.shift(), '*')
          }
          return
        }
        let { id, response } = e.data

        // 找到“中转页面”的消息对应的回调函数
        let currentCallback = _requests[id]
        if (!currentCallback) return
        // 调用并返回数据
        currentCallback(response, e.data)
        delete _requests[id]
      })
    }

    /**
     * 发起请求函数
     * @param method 请求方式
     * @param key
     * @param value
     */
    function _requestFn(method, key, value) {
      return new Promise((resolve) => {
        // 发消息时，请求对象格式
        const req = {
          id: uuid(),
          method,
          key,
          value,
          __msgType
        }

        //请求唯一标识 id 和回调函数的映射
        _requests[req.id] = resolve

        if (_cache.ready) {
          _iframeWin.postMessage(req, '*')
        } else {
          _cache.queue.push(req)
        }
      })
    }

    return {
      /**
       * 获取存储数据
       * @param {Object | string} key
       */
      getItem(key) {
        return _requestFn('get', key)
      },
      /**
       * 更新存储数据
       * @param {Object | string} key
       * @param {Object | string} value
       */
      setItem(key, value) {
        return _requestFn('set', key, value)
      },
      /**
       * 删除数据
       * @param {Object | string} key
       */
      delItem(key) {
        return _requestFn('delete', key)
      },
      /**
       * 清除数据
       */
      clear() {
        return _requestFn('clear')
      }
    }
  }

  function StorageServer() {
    if (window.parent === window) return
    const functionMap = {
      /**
       * 设置数据
       * @param {Object | string} key
       * @param {?Object | ?string} value
       */
      setStore(key, value) {
        if (!key) return
        if (typeof key === 'string') {
          return localStorage.setItem(key, typeof value === 'object' ? JSON.stringify(value) : value)
        }
        Object.keys(key).forEach((dataKey) => {
          let dataValue = typeof key[dataKey] === 'object' ? JSON.stringify(key[dataKey]) : key[dataKey]
          localStorage.setItem(dataKey, dataValue)
        })
      },

      /**
       * 获取数据
       * @param {Object | string} key
       */
      getStore(key) {
        if (!key) return
        if (typeof key === 'string') return localStorage.getItem(key)
        let dataRes = {}
        Object.keys(key).forEach((dataKey) => {
          dataRes[dataKey] = localStorage.getItem(dataKey) || null
        })
        return dataRes
      },

      /**
       * 删除数据
       * @param {Object | string} key
       */
      deleteStore(key) {
        if (!key) return
        if (typeof key === 'string') return localStorage.removeItem(key)
        Object.keys(key).forEach((dataKey) => {
          localStorage.removeItem(dataKey)
        })
      },

      /**
       * 清空
       */
      clearStore() {
        localStorage.clear()
      }
    }

    _initListener() //监听消息

    // 通知父页面
    window.parent.postMessage(
      {
        ready: true,
        __msgType
      },
      '*'
    )

    /**
     * 监听
     */
    function _initListener() {
      window.addEventListener('message', (e) => {
        if (e?.data?.__msgType !== __msgType) return
        const { method, key, value, id = 'default' } = e.data

        //获取方法
        const func = functionMap[`${method}Store`]

        //取出本地的数据
        const response = {
          data: func?.(key, value)
        }
        if (!func) response.errorMsg = 'Request method error!'

        //发送给父页面
        window.parent.postMessage(
          {
            id,
            request: e.data,
            response,
            __msgType
          },
          '*'
        )
      })
    }
  }
})()
