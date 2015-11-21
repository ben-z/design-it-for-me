class App extends React.Component {
  constructor(props) {
    super(props);
    this.default_state = JSON.stringify({
      num_cols: 63,
      fn_name: "some-fn",
      fn_parameters: ["p1","p2",""], // (listof Str)
      fn_purpose: "produces something magical with consumed parameters p1 and p2 on multiple lines.",
      fn_contract: ["Num","(listof Num)"], // (listof Str)
      fn_contract_output: "Num",
      fn_requires: [""]
    });

    let storage_state = (typeof(Storage) !== "undefined" && localStorage.difm_state)?JSON.parse(localStorage.difm_state):null;

    this.state = storage_state || JSON.parse(this.default_state);
    this.handleTextChange = this.handleTextChange.bind(this);
    this.handleParamChange = this.handleParamChange.bind(this);
    this.handleContractChange = this.handleContractChange.bind(this);
    this.handleRequiresChange = this.handleRequiresChange.bind(this);
    this.handleReset = this.handleReset.bind(this);
  }

  componentDidUpdate(prevProps, prevState) {
    if(typeof(Storage) !== "undefined") {
      return localStorage.difm_state = JSON.stringify(this.state);
    }
  }

  handleTextChange(e){
    // Prevent new lines
    if (e.target.value.indexOf("\n") !== -1) return e.preventDefault();
    let s = {};
    s[e.target.name]=e.target.value;
    return this.setState(s);
  }

  handleParamChange(e){
    let s = {};
    let params = this.state.fn_parameters;

    params[Number(e.target.name)] = e.target.value;
    if (params[params.length-1]!=="") {
      params.push("");
    }else if (params[params.length-1]==""&&params[params.length-2]=="") {
      params.pop();
    }

    s.fn_parameters=params;

    let contract = this.syncContract(this.state.fn_contract,params.length-1);
    s.fn_contract=contract;
    this.setState(s);
  }

  handleContractChange(e){
    let s = {};
    let contract = this.state.fn_contract;

    contract[Number(e.target.name)] = e.target.value;
    s["fn_contract"]=contract;
    return this.setState(s);
  }

  handleRequiresChange(e){
    let s = {};
    let requires = this.state.fn_requires;

    requires[Number(e.target.name)] = e.target.value;
    if (requires[requires.length-1]!=="") {
      requires.push("");
    }else if (requires[requires.length-1]==""&&requires[requires.length-2]=="") {
      requires.pop();
    }

    s["fn_requires"]=requires;
    this.setState(s);
  }

  syncContract(c,l){
    let pushEmpty = function(arr,n){
      if(n==0){
        return arr;
      }
      else{
        arr.push("");
        return pushEmpty(arr, n-1);
      }
    }
    if(c.length >= l){
      return c.splice(0,l);
    } else{
      return pushEmpty(c,l-c.length);
    }
  }

  handleReset(e){
    e.preventDefault();
    console.log("Resetting...");
    this.setState(JSON.parse(this.default_state));
  }

  listToInput(list,changeFn){
    return $.map(list, (val,i) => {
      return <input type="text" className="pure-input-1" key={i} name={i} value={val} onChange={changeFn} />
    });
  }

  trim_output(str, cols, add_spaces=0){
    if(cols<5) cols = 5;
    let make_spaces = function(n){
      if(n<=0){
        return "";
      }else{
        return " "+make_spaces(n-1);
      }
    }
    let append_comment = function(val){
      if(val.length <= cols){
        return val;
      }else if(val.substring(5, cols).indexOf(" ")<=-1){
        return val.substring(0, cols)+"\n"+append_comment(";;   "+make_spaces(add_spaces)+val.substring(cols));
      }else{
        return val.substring(0,val.substring(0, cols).lastIndexOf(" "))+"\n"+append_comment(";;  "+make_spaces(add_spaces)+val.substring(val.substring(0, cols).lastIndexOf(" ")));
      }
    }
    let los = str.split("\n");
    los = $.map(los, (val, i) => {
      if (val.length <= cols) {
        return val;
      }else{
        return append_comment(val);
      }
    });
    return los.join("\n");
  }

  render() {
    let params = this.listToInput(this.state.fn_parameters,this.handleParamChange);
    let contract = this.listToInput(this.state.fn_contract,this.handleContractChange);
    let requires = this.listToInput(this.state.fn_requires,this.handleRequiresChange);

    let valid_params = this.state.fn_parameters.filter((val,i)=>{return val !==""});

    let renderedPurpose = `(${this.state.fn_name} ${valid_params.join(" ")}) ${this.state.fn_purpose}`;

    let renderedContract = this.trim_output(`;; ${this.state.fn_name}: ${this.state.fn_contract.join(" ").trim()} -> ${this.state.fn_contract_output}\n`,this.state.num_cols,this.state.fn_name.length+2);

    let renderedRequires = (this.state.fn_requires.length===1&&this.state.fn_requires[0]==="")?"":this.trim_output(`;; requires: ${this.state.fn_requires.filter((data)=>data!=="").join(",\n;;           ")}\n`,this.state.num_cols,10);

    let check_expect_tmpl = `(check-expect (${this.state.fn_name} ${valid_params.map(()=>"...").join(" ")}) ...)`;

    let fn_template = `(define (${this.state.fn_name} ${valid_params.join(" ")})\n  (...))`;

    let rendered = this.trim_output(`;; ${renderedPurpose}\n`
                 + renderedContract
                 + renderedRequires
                 + `;; Examples:\n`
                 + check_expect_tmpl+"\n"
                 + check_expect_tmpl+"\n\n"
                 + fn_template+"\n\n"
                 + `;; Tests:\n`
                 + check_expect_tmpl, this.state.num_cols);

    let missing_params_in_purpose = this.state.fn_parameters.filter((val, i) => {
      return val!=="" && this.state.fn_purpose.replace(/,|\./g," ").indexOf(" "+val+" ") === -1;
    });

    return (
      <div>
        <h1 className="text-center"><span className="color-red">Design</span><span className="color-white">It</span><span className="color-black">For</span><span className="color-pink">Me</span></h1>

        <form className="pure-form pure-form-stacked">
        <fieldset>
          <div className="pure-g">
            <div className="pure-u-2-5">
              <label>Function Name:
              <div className="pure-u-23-24"><input type="text" className="pure-input-1" value={this.state.fn_name} name="fn_name" onChange={this.handleTextChange} /></div></label>
            </div>
            <div className="pure-u-2-5">
              <label># of Columns:
              <div className="pure-u-23-24"><input type="number" className="pure-input-1" value={this.state.num_cols} min={10} max={600} name="num_cols" onChange={this.handleTextChange} /></div></label>
            </div>
            <div className="pure-u-1-5">
              <label>&nbsp;
              <button className="pure-button button-error pure-input-1" onClick={this.handleReset}>
                <i className="fa fa-refresh">&nbsp;</i>
                Reset
              </button></label>
            </div>
          </div>
          <div className="pure-g">
            <div className="pure-u-1-2">
              <label>Parameters:
              <fieldset className="pure-group pure-u-23-24">{params}</fieldset></label>
            </div>
            <div className="pure-u-1-2">
              <label>Contract:
              <fieldset className="pure-group pure-u-24-24">{contract}
              <div className="pure-g"><div className="pure-u-4-24 text-center contract-output"><i className="fa fa-arrow-right"></i></div><div className="pure-u-20-24"><input type="text" className="pure-input-1" value={this.state.fn_contract_output} name="fn_contract_output" onChange={this.handleTextChange} /></div></div></fieldset></label>
            </div>
          </div>
          <div className="pure-g">
            <div className="pure-u-1">
              <label>Purpose:
              <textarea value={this.state.fn_purpose} name="fn_purpose" className="pure-input-1" cols={50} rows={5} onChange={this.handleTextChange} /></label>
            </div>
          </div>
          <div className="pure-g">
            <div className="pure-u-1">
              <label>Requires:
              <fieldset className="pure-group">{requires}</fieldset></label>
            </div>
          </div>
          </fieldset>
        </form>
        <div className="pure-g">
          <div className="pure-u-1">
            <h3>Checklist</h3>
            <ol>
              <li>Purpose includes parameter names {missing_params_in_purpose.length===0? <i className="fa fa-check color-success"></i>:<i className="fa fa-times color-danger"></i>}</li>
              {missing_params_in_purpose.length===0?"":<ul><li>Missing parameters:&nbsp;<span className="color-danger">{missing_params_in_purpose.join(", ")}</span></li></ul>}
            </ol>
          </div>
        </div>
        <br />
        <div className="pure-g pure-form">
          <div className="pure-u-1">
            <h3>Output</h3>
            <p>Select everything in the box below and paste into your racket definition window.</p>
            <textarea className="output pure-input-1" value={rendered} cols={this.state.num_cols} rows={(rendered.match(/\n/g) || []).length+1} onMouseOver={(e)=> e.target.select()} readOnly></textarea>
          </div>
        </div>
      </div>
    );
  }
}
ReactDOM.render(
  <App />,
  document.getElementById('app')
);
