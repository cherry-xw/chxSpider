const eventList: EventList = [
  {
    type: 'init'
  },
  {
    type: 'visit',
    id: 'baidu',
    input: 'https://www.baidu.com'
  },
  {
    type: 'login',
    mode: 'manual',
    id: 'qyyjt'
  },
  // {
  //   type: 'login',
  //   mode: 'auto',
  //   id: 'qcc',
  //   input: {
  //     userName: "123",
  //     password: "123"
  //   }
  // }
  {
    type: 'visit',
    id: 'qyyjt',
    input: 'https://www.qyyjt.cn/detail/enterprise/overview?code=13411E0D05A30642B50F25318AA72F2F&type=company',
    wait: 1500
  },
  {
    type: 'select',
    id: 'qyyjt',
    input: '.summaryWrapper .titleWrapper .title span',
    handle: 'text',
    processTag: 'companyName'
  }
];

export default eventList;
