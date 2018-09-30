<?php


  class TimeSlot{
    var $U=[];
    var $V=[];
    var $X=[];
    var $Y=[];
    var $allDat=[];
    var $Time;
    var $Unit;

    function __construct($row,$Unit) {
      $this->addRow($row);
      $this->Time=$row["Time"];
      $this->Unit=$Unit;
    }
    function addRow ($row){
      $this->U[]=floatval($row["U"]);
      $this->V[]=floatval($row["V"]);
      $this->X[]=floatval($row["X"]);
      $this->Y[]=floatval($row["Y"]);
    }
    function Output ($var,$varName,$parNum){
      $uniQX=array_unique($this->X);
      $uniQY=array_unique($this->Y);
      //to do: Change parameterCategory to correct values
      $output=["header"=>["parameterUnit"=> $this->Unit,
        "parameterNumber"=> $parNum,
        "parameterNumberName"=> $varName,
        "parameterCategory"=> 2,
        "dx"=> (max($this->X)-min($this->X))/(count($uniQX)-1),
        "dy"=> (max($this->Y)-min($this->Y))/(count($uniQY)-1),
        "lo1"=> min($this->X),
        "lo2"=> max($this->X),
        "la1"=> max($this->Y),
        "la2"=> min($this->Y),
        "nx"=> count($uniQX),
        "ny"=> count($uniQY),
        "refTime"=> $this->Time],
        "data"=>$var];
        return $output;
    }
    function ProduceOutputs () {
      array_multisort($this->Y, SORT_DESC,$this->X,$this->U,$this->V);
      $outputs=[];
      $outputs[]=$this->Output($this->U,"U",2);
      $outputs[]=$this->Output($this->V,"V",3);
      return $outputs;

    }

  }

  $config = parse_ini_file('../../../app_data/config.ini');

  if ($_POST) {
    $link = mysqli_connect("shareddb1e.hosting.stackcp.net",$config['username'],$config['password'],$config['dbname']);
    if (!mysqli_connect_error()){
      foreach($_POST as $key => $value) {
        if (ini_get('magic_quotes_gpc')) {
          $_POST[$key] = stripslashes($_POST[$key]);
        }
        $_POST[$key] = htmlspecialchars(strip_tags($_POST[$key]));
        $_POST[$key] = mysqli_real_escape_string($link,$_POST[$key]);
      }

      $query= "SELECT Unit FROM Variables WHERE ID =".$_POST['varID'];
      if($result = mysqli_query($link, $query)) {
        $row=$result->fetch_array();
        $Unit=$row[0];
      }
      $query= "SELECT WeatherVar.U,WeatherVar.V,TimeStamps.Time,ST_X(Points.Point) as X,ST_Y(Points.Point) as Y FROM \n"

    . "(SELECT WeatherData.TimeID,WeatherData.PointID,WeatherData.U,WeatherData.V FROM WeatherData WHERE WeatherData.VariableID=".$_POST['varID']." AND WeatherData.ParameterID = ".$_POST['parID'].") AS WeatherVar\n"

    . "INNER JOIN \n"

    . "TimeStamps ON WeatherVar.TimeID = TimeStamps.ID \n"

    . "INNER JOIN \n"

    . "Points ON WeatherVar.PointID=Points.ID\n"

    . "WHERE MBRContains( GeomFromText( 'LINESTRING(".$_POST['left']." ".$_POST['bottom'].",".$_POST['right']." ".$_POST['top'].")' ),Points.Point) AND TimeStamps.TimeInt <= ".$_POST['maxTime']." AND TimeStamps.TimeInt >= ".$_POST['minTime'];

      if($result = mysqli_query($link, $query)) {
        //echo $query;
        $timeSlots=[];
        while($row=$result->fetch_assoc()){
          $slotFound=False;
          foreach ($timeSlots as $slot) {
            if ($slot->Time==$row["Time"]){
              $slot->addRow($row);
              $slotFound=True;
            }
          }

          if (!$slotFound) {
            $timeSlots[]=new TimeSlot($row,$Unit);
          }
        }

        $outputs=[];
        foreach ($timeSlots as $slot) {
          $outputs[]=$slot->ProduceOutputs();
        }
        die (json_encode($outputs));

      } else {
        echo $query."<br>";
        echo $link->error;
      }
    }
  }
